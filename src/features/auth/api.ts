import type { Session } from '@supabase/supabase-js';
import { callFunction, supabase } from '@/lib/supabase';

// Login with email, username or CPF through the "login" Edge Function.
export async function loginWithIdentifier(identifier: string, password: string) {
  const { session } = await callFunction<{ session: Session }>('login', { identifier, password });
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw error;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
  if (error) throw error;
  return data === true;
}

// Creates the account. The database creates the profile from the username.
// The user must confirm the email before the first login.
export async function signUp(params: { username: string; email: string; password: string }) {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { username: params.username } },
  });
  if (error) throw error;
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

// "Usar outro email": moves an unconfirmed sign-up to another email.
export async function changeSignupEmail(params: { email: string; password: string; newEmail: string }) {
  await callFunction('change-signup-email', params);
}

export async function signOut() {
  await supabase.auth.signOut();
}
