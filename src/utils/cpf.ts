export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// "52998224725" -> "529.982.247-25" (works while typing).
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Same check-digit rule as private.is_valid_cpf in the database.
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);
  const check = (length: number) => {
    let total = 0;
    for (let i = 0; i < length; i++) total += digits[i] * (length + 1 - i);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return check(9) === digits[9] && check(10) === digits[10];
}
