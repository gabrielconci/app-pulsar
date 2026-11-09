// Short counts for stats: 950 -> "950", 1500 -> "1,5k", 20000 -> "20k", 2300000 -> "2,3M".
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const [value, suffix] = n < 1_000_000 ? [n / 1000, 'k'] : [n / 1_000_000, 'M'];
  const rounded = value >= 100 ? Math.floor(value) : Math.floor(value * 10) / 10;
  return `${String(rounded).replace('.', ',')}${suffix}`;
}
