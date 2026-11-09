// Keeps the email and password of a sign-up in memory only, so "Confira seu
// email" can log in after confirmation without asking again. Never stored on
// disk and never put in a route URL.
type PendingSignup = { email: string; password: string };

let pending: PendingSignup | null = null;

export const pendingSignup = {
  set(value: PendingSignup) {
    pending = value;
  },
  get(): PendingSignup | null {
    return pending;
  },
  clear() {
    pending = null;
  },
};
