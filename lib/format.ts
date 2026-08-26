// Shared currency formatting. Amounts are stored as plain numbers
// (numeric(14,2) in Postgres) representing whole reais with cents as the
// decimal part (e.g. 1234.56), not integer cents.
//
// Form inputs use native <input type="number" step="0.01"> so the value
// string is always period-decimal regardless of browser locale — no custom
// parsing needed, just Number(formData.get(...)).

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseAmount(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
