// POST /functions/v1/change-signup-email
// Body: { email: string, password: string, newEmail: string }
// For the "Usar outro email" link on "Confira seu email": moves a sign-up
// that was never confirmed to another email and sends a new confirmation.
// The password proves the caller owns the sign-up (there is no session yet).
// Errors: invalid_credentials | already_confirmed | invalid_email |
//         email_in_use | too_many_requests | server_error

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, env, json, readJson } from '../_shared/http.ts';

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await readJson(req);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const newEmail = typeof body?.newEmail === 'string' ? body.newEmail.trim().toLowerCase() : '';

  if (!email || !password) return json({ error: 'invalid_credentials' }, 401);
  if (!EMAIL_RE.test(newEmail) || newEmail.length > 254) return json({ error: 'invalid_email' }, 400);

  try {
    const publicClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), clientOptions);

    // Supabase checks the password before the confirmation, so
    // "email_not_confirmed" means the password is right.
    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });
    if (data?.session) {
      await publicClient.auth.signOut();
      return json({ error: 'already_confirmed' }, 409);
    }
    if (error?.status === 429) return json({ error: 'too_many_requests' }, 429);
    if (error?.code !== 'email_not_confirmed') return json({ error: 'invalid_credentials' }, 401);

    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), clientOptions);
    const { data: userId, error: lookupError } = await admin.rpc('user_id_for_email', { p_email: email });
    if (lookupError) throw lookupError;
    if (!userId) return json({ error: 'invalid_credentials' }, 401);

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { email: newEmail });
    if (updateError) {
      if (updateError.code === 'email_exists') return json({ error: 'email_in_use' }, 409);
      throw updateError;
    }

    const { error: resendError } = await publicClient.auth.resend({ type: 'signup', email: newEmail });
    if (resendError) {
      if (resendError.status === 429) return json({ error: 'too_many_requests' }, 429);
      throw resendError;
    }

    return json({ ok: true });
  } catch (err) {
    console.error('change-signup-email failed', err);
    return json({ error: 'server_error' }, 500);
  }
});
