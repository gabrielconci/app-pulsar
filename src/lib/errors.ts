// Turns error codes from Supabase and our Edge Functions into messages for
// the user.
const messages: Record<string, string> = {
  invalid_credentials: 'Usuário, email, CPF ou senha incorretos.',
  email_not_confirmed: 'Seu email ainda não foi confirmado. Abra o link que enviamos e tente de novo.',
  too_many_requests: 'Muitas tentativas seguidas. Espere um minuto e tente de novo.',
  over_email_send_rate_limit: 'Muitos emails enviados. Espere um minuto e tente de novo.',
  user_already_exists: 'Já existe uma conta com esse email.',
  email_exists: 'Já existe uma conta com esse email.',
  email_in_use: 'Já existe uma conta com esse email.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.',
  invalid_email: 'Email inválido.',
  email_address_invalid: 'Email inválido.',
  already_confirmed: 'Esse email já foi confirmado. Volte e entre na sua conta.',
  empty_file: 'Não foi possível ler esse arquivo. Escolha outro.',
  network_error: 'Sem conexão. Confira sua internet e tente de novo.',
};

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    if (code && messages[code]) return messages[code];
    const message = (error as { message?: string }).message;
    if (message && messages[message]) return messages[message];
    if (message && /network|fetch/i.test(message)) return messages.network_error;
  }
  return 'Algo deu errado. Tente de novo em instantes.';
}
