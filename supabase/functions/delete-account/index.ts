// POST /functions/v1/delete-account  (requires the user's access token)
// Body: { reason: string, details?: string }
// Deletes the user's files, saves the anonymous reason, then deletes the
// account. Profile, interests and posts are removed by ON DELETE CASCADE.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, env, json, readJson } from '../_shared/http.ts';

const REASONS = new Set([
  'dados_pessoais',
  'muitos_emails',
  'trocar_email',
  'outras_contas',
  'remover_apps',
  'nao_preciso',
  'outro',
]);
const BUCKETS = ['avatars', 'post-media'];
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

// Files are stored flat inside "<user id>/", so one folder level is enough.
async function removeUserFiles(admin: SupabaseClient, userId: string) {
  for (const bucket of BUCKETS) {
    while (true) {
      const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
      if (error) throw error;
      if (!data || data.length === 0) break;

      const paths = data.map((file) => `${userId}/${file.name}`);
      const { error: removeError } = await admin.storage.from(bucket).remove(paths);
      if (removeError) throw removeError;
      if (data.length < 1000) break;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'not_authenticated' }, 401);

  const body = await readJson(req);
  const reason = typeof body?.reason === 'string' ? body.reason : '';
  const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 1000) : null;
  if (!REASONS.has(reason)) return json({ error: 'invalid_reason' }, 400);

  try {
    const userClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      ...clientOptions,
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'not_authenticated' }, 401);
    const userId = userData.user.id;

    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), clientOptions);

    await removeUserFiles(admin, userId);

    const { error: feedbackError } = await admin
      .from('account_deletion_feedback')
      .insert({ reason, details: details || null });
    if (feedbackError) console.error('could not save deletion feedback', feedbackError);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return json({ ok: true });
  } catch (err) {
    console.error('delete-account failed', err);
    return json({ error: 'server_error' }, 500);
  }
});
