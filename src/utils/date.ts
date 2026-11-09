// "05041999" -> "05/04/1999" (works while typing).
export function formatDateInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// "05/04/1999" -> "1999-04-05", or null if it isn't a real date.
export function parseBrDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (
    date.getUTCFullYear() !== Number(yyyy) ||
    date.getUTCMonth() !== Number(mm) - 1 ||
    date.getUTCDate() !== Number(dd)
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

// "1999-04-05" -> "05/04/1999"
export function isoToBrDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

export function ageFromIso(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}
