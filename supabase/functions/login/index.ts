// POST /functions/v1/login
// Body: { identifier: string (email, username or CPF), password: string }
// Returns: { session } on success, or { error } with one of:
//   invalid_credentials | email_not_confirmed | too_many_requests | server_error
//
// The app then calls supabase.auth.setSession(session).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, env, json, readJson } from '../_shared/http.ts';

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await readJson(req);
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!identifier || !password || identifier.length > 254 || password.length > 72) {
    return json({ error: 'invalid_credentials' }, 401);
  }

  try {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), clientOptions);
    const { data: email, error: lookupError } = await admin.rpc('email_for_identifier', {
      p_identifier: identifier,
    });
    if (lookupError) throw lookupError;

    // Same answer for "user not found" and "wrong password".
    if (typeof email !== 'string' || !email) {
      return json({ error: 'invalid_credentials' }, 401);
    }

    const publicClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), clientOptions);
    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      if (error?.status === 429) return json({ error: 'too_many_requests' }, 429);
      if (error?.code === 'email_not_confirmed') return json({ error: 'email_not_confirmed' }, 403);
      return json({ error: 'invalid_credentials' }, 401);
    }

    return json({ session: data.session });
  } catch (err) {
    console.error('login failed', err);
    return json({ error: 'server_error' }, 500);
  }
});
