import type { MonthKey } from './types';

const PT_BR_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function formatMonthLabel(year: number, month: number): string {
  return `${PT_BR_MONTHS[month - 1]}/${String(year).slice(2)}`;
}

export function getMonthsAxis(startMonth: string, projectionMonths: number): MonthKey[] {
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  return Array.from({ length: projectionMonths }, (_, i) => {
    const totalMonths = (startMonthNum - 1) + i;
    const year = startYear + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    return { year, month, label: formatMonthLabel(year, month) };
  });
}

export function monthKeyEquals(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

export function monthsBetween(from: MonthKey, to: MonthKey): number {
  return (to.year - from.year) * 12 + (to.month - from.month);
}

export function monthKeyFromDate(dateIso: string): MonthKey {
  const [year, month] = dateIso.split('-').map(Number);
  return { year, month, label: formatMonthLabel(year, month) };
}

export function addMonths(month: MonthKey, offset: number): MonthKey {
  const totalMonths = (month.month - 1) + offset;
  const year = month.year + Math.floor(totalMonths / 12);
  const normalizedMonth = ((totalMonths % 12) + 12) % 12 + 1;
  return { year, month: normalizedMonth, label: formatMonthLabel(year, normalizedMonth) };
}
