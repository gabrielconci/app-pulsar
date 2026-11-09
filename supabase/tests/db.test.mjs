// Database tests: run every migration on PGlite (embedded Postgres) and check
// the rules. Run with: npm run test:db

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

const VALID_CPF = '52998224725';
const OTHER_VALID_CPF = '11144477735';

let db;
const users = {};

// Runs fn as a logged-in user (role "authenticated"), or as anon when uid is null.
async function as(uid, fn) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('role', $1, true)`, [uid ? 'authenticated' : 'anon']);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    return fn(tx);
  });
}

// Expects fn to fail. A failed query aborts the whole transaction, so the
// assertion wraps the transaction instead of the query.
// Pass `expected` (a RegExp) to also check why it failed.
async function rejectsAs(uid, fn, message, expected) {
  await assert.rejects(as(uid, fn), expected ? { message: expected } : undefined, message);
}

async function asServiceRole(fn) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('role', 'service_role', true)`);
    return fn(tx);
  });
}

async function signUp(email, username) {
  const { rows } = await db.query(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, JSON.stringify({ username })],
  );
  return rows[0].id;
}

async function uploadFile(uid, name, bucket = 'post-media') {
  const path = `${uid}/${name}`;
  await db.query(`insert into storage.objects (bucket_id, name, owner_id) values ($1, $2, $3)`, [
    bucket,
    path,
    uid,
  ]);
  return path;
}

function createPost(tx, type, media, extra = {}) {
  return tx.query(
    `select public.create_post($1::public.post_type, $2::jsonb, $3, $4, $5, $6) as id`,
    [type, JSON.stringify(media), extra.title ?? null, extra.subtitle ?? null, extra.body ?? null, extra.caption ?? null],
  );
}

before(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(here, 'supabase-stubs.sql'), 'utf8'));
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  users.ana = await signUp('ana@example.com', 'Ana.Costa');
  users.joao = await signUp('joao@example.com', 'joaoptorres');
});

test('sign-up creates profile and private row with lowercase username', async () => {
  const { rows } = await db.query(`select username from public.profiles where id = $1`, [users.ana]);
  assert.equal(rows[0].username, 'ana.costa');
  const priv = await db.query(`select cpf from public.profile_private where id = $1`, [users.ana]);
  assert.equal(priv.rows.length, 1);
  assert.equal(priv.rows[0].cpf, null);
});

test('sign-up fails for invalid, digit-only or duplicate usernames', async () => {
  await assert.rejects(signUp('x1@example.com', 'ab'));
  await assert.rejects(signUp('x2@example.com', '12345678901'));
  await assert.rejects(signUp('x3@example.com', 'ana costa'));
  await assert.rejects(signUp('x4@example.com', 'ANA.COSTA'));
  await assert.rejects(signUp('x5@example.com', null));
});

test('username availability check works for anon', async () => {
  await as(null, async (tx) => {
    const taken = await tx.query(`select public.is_username_available('Ana.Costa') as ok`);
    assert.equal(taken.rows[0].ok, false);
    const free = await tx.query(`select public.is_username_available('novo_user') as ok`);
    assert.equal(free.rows[0].ok, true);
  });
});

test('CPF must be valid and unique', async () => {
  await rejectsAs(users.ana, (tx) => tx.query(`update public.profile_private set cpf = '12345678900'`));
  await rejectsAs(users.ana, (tx) => tx.query(`update public.profile_private set cpf = '11111111111'`));
  await as(users.ana, (tx) => tx.query(`update public.profile_private set cpf = $1`, [VALID_CPF]));
  await as(users.joao, async (tx) => {
    const free = await tx.query(`select public.is_cpf_available('529.982.247-25') as ok`);
    assert.equal(free.rows[0].ok, false);
  });
  await rejectsAs(users.joao, (tx) => tx.query(`update public.profile_private set cpf = $1`, [VALID_CPF]));
  await as(users.joao, (tx) => tx.query(`update public.profile_private set cpf = $1`, [OTHER_VALID_CPF]));
});

test('CPF is private to its owner', async () => {
  await as(users.joao, async (tx) => {
    const { rows } = await tx.query(`select id, cpf from public.profile_private`);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, users.joao);
  });
  await rejectsAs(null, (tx) => tx.query(`select * from public.profile_private`));
});

test('users can edit only their own profile', async () => {
  await as(users.ana, async (tx) => {
    const own = await tx.query(
      `update public.profiles set full_name = 'Ana Costa', bio = 'Bailarina' where id = $1`,
      [users.ana],
    );
    assert.equal(own.affectedRows, 1);
    const other = await tx.query(`update public.profiles set full_name = 'Hacked' where id = $1`, [users.joao]);
    assert.equal(other.affectedRows, 0);
  });
  await rejectsAs(users.ana, (tx) => tx.query(`update public.profiles set created_at = now() where id = $1`, [users.ana]));
  await rejectsAs(null, (tx) => tx.query(`select * from public.profiles`));
});

test('interests: up to 8, replaced atomically', async () => {
  await as(users.ana, async (tx) => {
    const { rows } = await tx.query(`select count(*)::int as n from public.interests`);
    assert.equal(rows[0].n, 24);
    await tx.query(`select public.set_my_interests(array[1,2,3,4,5,6,7,8]::smallint[])`);
    const mine = await tx.query(`select count(*)::int as n from public.profile_interests where profile_id = $1`, [users.ana]);
    assert.equal(mine.rows[0].n, 8);
  });
  await rejectsAs(users.ana, (tx) => tx.query(`select public.set_my_interests(array[1,2,3,4,5,6,7,8,9]::smallint[])`));
  await rejectsAs(users.ana, (tx) => tx.query(`insert into public.profile_interests (profile_id, interest_id) values ($1, 9)`, [users.ana]));
  await rejectsAs(users.ana, (tx) => tx.query(`insert into public.profile_interests (profile_id, interest_id) values ($1, 1)`, [users.joao]));
  await as(users.ana, async (tx) => {
    await tx.query(`select public.set_my_interests(array[3,3,10]::smallint[])`);
    const mine = await tx.query(`select interest_id from public.profile_interests where profile_id = $1 order by 1`, [users.ana]);
    assert.deepEqual(mine.rows.map((r) => r.interest_id), [3, 10]);
  });
});

test('create_post: valid posts of every type', async () => {
  const video = await uploadFile(users.ana, 'v1.mp4');
  const photo = await uploadFile(users.ana, 'p1.jpg');
  const c1 = await uploadFile(users.ana, 'c1.jpg');
  const c2 = await uploadFile(users.ana, 'c2.mp4');
  const cover = await uploadFile(users.ana, 'cover.jpg');

  await as(users.ana, async (tx) => {
    await createPost(tx, 'video', [{ path: video, kind: 'video', duration_ms: 30000 }], { caption: 'Ensaio' });
    await createPost(tx, 'photo', [{ path: photo, kind: 'image', width: 1080, height: 1350 }]);
    await createPost(tx, 'carousel', [
      { path: c1, kind: 'image' },
      { path: c2, kind: 'video', duration_ms: 12000 },
    ]);
    const { rows } = await createPost(tx, 'project', [{ path: cover, kind: 'image' }], {
      title: 'Minha trajetória',
      subtitle: 'Desde criança',
      body: 'Texto do projeto',
      caption: 'Legenda do projeto',
    });
    const project = await tx.query(`select title, caption from public.posts where id = $1`, [rows[0].id]);
    assert.equal(project.rows[0].title, 'Minha trajetória');
    assert.equal(project.rows[0].caption, 'Legenda do projeto');
  });

  const media = await db.query(
    `select m.position, m.kind from public.post_media m join public.posts p on p.id = m.post_id
     where p.type = 'carousel' order by m.position`,
  );
  assert.deepEqual(media.rows.map((r) => [r.position, r.kind]), [[0, 'image'], [1, 'video']]);
});

test('create_post: rejects invalid input', async () => {
  const long = await uploadFile(users.ana, 'long.mp4');
  const img = await uploadFile(users.ana, 'img.jpg');
  const joaoFile = await uploadFile(users.joao, 'j.jpg');

  const cases = [
    ['video longer than 30s', /duration_ms_check/, 'video', [{ path: long, kind: 'video', duration_ms: 30001 }]],
    ['video without duration', /video_has_duration/, 'video', [{ path: long, kind: 'video' }]],
    ['photo post with a video', /invalid_media/, 'photo', [{ path: long, kind: 'video', duration_ms: 1000 }]],
    ['carousel with 1 item', /invalid_media/, 'carousel', [{ path: img, kind: 'image' }]],
    ['project without title', /invalid_project/, 'project', [{ path: img, kind: 'image' }], { body: 'x' }],
    ['project with 4 images', /invalid_media/, 'project', Array(4).fill({ path: img, kind: 'image' }), { title: 't', body: 'b' }],
    ["someone else's file", /invalid_media_path/, 'photo', [{ path: joaoFile, kind: 'image' }]],
    ['file not uploaded', /media_not_uploaded/, 'photo', [{ path: `${users.ana}/missing.jpg`, kind: 'image' }]],
    ['media not an array', /invalid_media/, 'photo', { path: img }],
  ];
  for (const [name, expected, type, media, extra] of cases) {
    await rejectsAs(users.ana, (tx) => createPost(tx, type, media, extra), name, expected);
  }

  await rejectsAs(null, (tx) => createPost(tx, 'photo', [{ path: img, kind: 'image' }]), 'anon', /permission denied/);
  await rejectsAs(
    users.ana,
    (tx) => tx.query(`insert into public.posts (author_id, type) values ($1, 'photo')`, [users.ana]),
    'direct insert',
    /permission denied/,
  );
});

test('posts: everyone logged in reads, only the author edits or deletes', async () => {
  const { rows } = await db.query(`select id from public.posts where author_id = $1 and type = 'photo'`, [users.ana]);
  const postId = rows[0].id;

  await as(users.joao, async (tx) => {
    const read = await tx.query(`select id from public.posts where id = $1`, [postId]);
    assert.equal(read.rows.length, 1);
    const upd = await tx.query(`update public.posts set caption = 'x' where id = $1`, [postId]);
    assert.equal(upd.affectedRows, 0);
    const del = await tx.query(`delete from public.posts where id = $1`, [postId]);
    assert.equal(del.affectedRows, 0);
  });
  await as(users.ana, async (tx) => {
    const upd = await tx.query(`update public.posts set caption = 'Nova legenda' where id = $1`, [postId]);
    assert.equal(upd.affectedRows, 1);
  });
});

test('create_post: video cover must be an own upload', async () => {
  const video = await uploadFile(users.ana, 'thumbv.mp4');
  const thumb = await uploadFile(users.ana, 'thumbv.jpg');
  const joaoThumb = await uploadFile(users.joao, 'jthumb.jpg');
  const img = await uploadFile(users.ana, 'thumbimg.jpg');
  await as(users.ana, async (tx) => {
    const { rows } = await createPost(tx, 'video', [{ path: video, kind: 'video', duration_ms: 5000, thumbnail_path: thumb }]);
    const m = await tx.query(`select thumbnail_path from public.post_media where post_id = $1`, [rows[0].id]);
    assert.equal(m.rows[0].thumbnail_path, thumb);
    await tx.query(`delete from public.posts where id = $1`, [rows[0].id]);
  });
  const video2 = await uploadFile(users.ana, 'thumbv2.mp4');
  const vid = (thumbnail_path) => [{ path: video2, kind: 'video', duration_ms: 5000, thumbnail_path }];
  await rejectsAs(users.ana, (tx) => createPost(tx, 'video', vid(joaoThumb)), 'other user thumb', /invalid_media_path/);
  await rejectsAs(users.ana, (tx) => createPost(tx, 'video', vid(`${users.ana}/nope.jpg`)), 'thumb missing', /media_not_uploaded/);
  await rejectsAs(users.ana, (tx) => createPost(tx, 'photo', [{ path: img, kind: 'image', thumbnail_path: thumb }]), 'thumb on image', /thumbnail_only_for_video/);
});

test('posts: title/body cannot be added to non-project posts', async () => {
  const { rows } = await db.query(`select id from public.posts where author_id = $1 and type = 'photo'`, [users.ana]);
  await rejectsAs(users.ana, (tx) => tx.query(`update public.posts set title = 'x' where id = $1`, [rows[0].id]), 'title on photo', /project_fields_only_on_projects/);
});

test('claps: toggle as yourself only, counted in get_posts', async () => {
  const { rows } = await db.query(`select id from public.posts where author_id = $1 and type = 'photo'`, [users.ana]);
  const postId = rows[0].id;
  await as(users.joao, async (tx) => {
    await tx.query(`insert into public.post_claps (post_id) values ($1)`, [postId]);
    const p = await tx.query(`select claps_count, clapped_by_me from public.get_posts(p_post_id => $1)`, [postId]);
    assert.equal(Number(p.rows[0].claps_count), 1);
    assert.equal(p.rows[0].clapped_by_me, true);
  });
  await rejectsAs(users.joao, (tx) => tx.query(`insert into public.post_claps (post_id) values ($1)`, [postId]), 'double clap', /duplicate key/);
  await rejectsAs(users.ana, (tx) => tx.query(`insert into public.post_claps (post_id, user_id) values ($1, $2)`, [postId, users.joao]), 'clap as someone else', /permission denied/);
  await as(users.ana, async (tx) => {
    const p = await tx.query(`select clapped_by_me from public.get_posts(p_post_id => $1)`, [postId]);
    assert.equal(p.rows[0].clapped_by_me, false);
    const del = await tx.query(`delete from public.post_claps where post_id = $1`, [postId]);
    assert.equal(del.affectedRows, 0);
  });
  await as(users.joao, async (tx) => {
    const del = await tx.query(`delete from public.post_claps where post_id = $1`, [postId]);
    assert.equal(del.affectedRows, 1);
    await tx.query(`insert into public.post_claps (post_id) values ($1)`, [postId]);
  });
});

test('views: unique per person, author not counted, not readable directly', async () => {
  const { rows } = await db.query(`select id from public.posts where author_id = $1 and type = 'photo'`, [users.ana]);
  const postId = rows[0].id;
  await as(users.joao, async (tx) => {
    await tx.query(`select public.record_post_view($1)`, [postId]);
    await tx.query(`select public.record_post_view($1)`, [postId]);
  });
  await as(users.ana, (tx) => tx.query(`select public.record_post_view($1)`, [postId]));
  await as(users.ana, async (tx) => {
    const p = await tx.query(`select views_count from public.get_posts(p_post_id => $1)`, [postId]);
    assert.equal(Number(p.rows[0].views_count), 1);
  });
  await rejectsAs(users.joao, (tx) => tx.query(`select * from public.post_views`), 'read views', /permission denied/);
  await rejectsAs(users.joao, (tx) => tx.query(`insert into public.post_views (post_id, user_id) values ($1, $2)`, [postId, users.joao]), 'insert view', /permission denied/);
  await rejectsAs(null, (tx) => tx.query(`select * from public.get_posts()`), 'anon feed', /permission denied/);
});

test('comments and comment likes', async () => {
  const { rows } = await db.query(`select id from public.posts where author_id = $1 and type = 'photo'`, [users.ana]);
  const postId = rows[0].id;
  const commentId = await as(users.joao, async (tx) => {
    const c = await tx.query(`insert into public.comments (post_id, body) values ($1, 'Lindo!') returning id, author_id`, [postId]);
    assert.equal(c.rows[0].author_id, users.joao);
    return c.rows[0].id;
  });
  await rejectsAs(users.joao, (tx) => tx.query(`insert into public.comments (post_id, body) values ($1, '   ')`, [postId]), 'empty comment', /comments_body_check/);
  await rejectsAs(users.ana, (tx) => tx.query(`insert into public.comments (post_id, author_id, body) values ($1, $2, 'x')`, [postId, users.joao]), 'comment as someone else', /permission denied/);
  await as(users.ana, async (tx) => {
    await tx.query(`insert into public.comment_likes (comment_id) values ($1)`, [commentId]);
    const list = await tx.query(`select body, author_full_name, likes_count, liked_by_me from public.get_comments($1)`, [postId]);
    assert.equal(list.rows.length, 1);
    assert.equal(Number(list.rows[0].likes_count), 1);
    assert.equal(list.rows[0].liked_by_me, true);
    const del = await tx.query(`delete from public.comments where id = $1`, [commentId]);
    assert.equal(del.affectedRows, 0);
    const p = await tx.query(`select comments_count from public.get_posts(p_post_id => $1)`, [postId]);
    assert.equal(Number(p.rows[0].comments_count), 1);
  });
  await as(users.joao, async (tx) => {
    const del = await tx.query(`delete from public.comments where id = $1`, [commentId]);
    assert.equal(del.affectedRows, 1);
  });
});

test('get_posts: newest first, paged by cursor, filter by author', async () => {
  await as(users.joao, async (tx) => {
    const all = await tx.query(`select id, created_at, media from public.get_posts(p_limit => 50)`);
    assert.ok(all.rows.length >= 4);
    const page1 = await tx.query(`select id, created_at from public.get_posts(p_limit => 2)`);
    const last = page1.rows[1];
    const page2 = await tx.query(
      `select id from public.get_posts(p_limit => 50, p_before_created_at => $1, p_before_id => $2)`,
      [last.created_at, last.id],
    );
    assert.equal(page2.rows.length, all.rows.length - 2);
    assert.ok(!page2.rows.some((r) => page1.rows.some((q) => q.id === r.id)));
    const mine = await tx.query(`select id from public.get_posts(p_author_id => $1)`, [users.joao]);
    assert.equal(mine.rows.length, 0);
    const carousel = all.rows.find((r) => r.media.length === 2);
    assert.deepEqual(carousel.media.map((m) => m.position), [0, 1]);
  });
});

test('storage: users can only upload to their own folder', async () => {
  await as(users.ana, async (tx) => {
    await tx.query(`insert into storage.objects (bucket_id, name, owner_id) values ('avatars', $1, $2)`, [
      `${users.ana}/avatar.jpg`,
      users.ana,
    ]);
  });
  await rejectsAs(users.ana, (tx) => tx.query(`insert into storage.objects (bucket_id, name, owner_id) values ('avatars', $1, $2)`, [
        `${users.joao}/avatar.jpg`,
        users.ana,
      ]));
});

test('email_for_identifier: email, username or CPF; service role only', async () => {
  await asServiceRole(async (tx) => {
    const lookup = async (id) =>
      (await tx.query(`select public.email_for_identifier($1) as email`, [id])).rows[0].email;
    assert.equal(await lookup('ANA@example.com'), 'ana@example.com');
    assert.equal(await lookup('Ana.Costa'), 'ana@example.com');
    assert.equal(await lookup('@ana.costa'), 'ana@example.com');
    assert.equal(await lookup('529.982.247-25'), 'ana@example.com');
    assert.equal(await lookup(OTHER_VALID_CPF), 'joao@example.com');
    assert.equal(await lookup('ninguem'), null);
    assert.equal(await lookup('   '), null);
  });
  for (const uid of [users.ana, null]) {
    await rejectsAs(uid, (tx) => tx.query(`select public.email_for_identifier('ana.costa')`));
  }
});

test('profile stats', async () => {
  await as(users.joao, async (tx) => {
    const { rows } = await tx.query(`select * from public.get_profile_stats($1)`, [users.ana]);
    assert.equal(Number(rows[0].posts_count), 4);
    assert.equal(Number(rows[0].claps_count), 1);
    assert.equal(Number(rows[0].audience_count), 1);
    assert.ok(rows[0].member_since instanceof Date);
  });
});

test('deleting the auth user removes profile, interests and posts', async () => {
  await db.query(`delete from auth.users where id = $1`, [users.ana]);
  for (const [table, column] of [
    ['profiles', 'id'],
    ['profile_private', 'id'],
    ['profile_interests', 'profile_id'],
    ['posts', 'author_id'],
    ['post_claps', 'user_id'],
    ['comments', 'author_id'],
  ]) {
    const { rows } = await db.query(`select count(*)::int as n from public.${table} where ${column} = $1`, [users.ana]);
    assert.equal(rows[0].n, 0, table);
  }
  const { rows } = await db.query(`select count(*)::int as n from public.post_media`);
  assert.equal(rows[0].n, 0);
});
