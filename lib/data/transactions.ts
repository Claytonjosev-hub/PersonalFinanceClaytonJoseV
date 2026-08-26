import { createClient } from '@/lib/supabase/server';
import type { Transaction } from '@/lib/ledger/types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// [startInclusive, endExclusive) as YYYY-MM-DD, matching Postgres date range
// semantics used by the .gte/.lt filters below.
export function monthDateRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${pad(month)}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${pad(nextMonth)}-01`;
  return { start, end };
}

export async function listTransactionsForMonth(year: number, month: number): Promise<Transaction[]> {
  const { start, end } = monthDateRange(year, month);
  const supabase = await createClient();
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', start)
    .lt('date', end)
    .order('date', { ascending: true });
  return data ?? [];
}

// Covers every month in the axis with a single query instead of one round
// trip per month.
export async function listTransactionsForRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<Transaction[]> {
  const { start } = monthDateRange(startYear, startMonth);
  const { end } = monthDateRange(endYear, endMonth);
  const supabase = await createClient();
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', start)
    .lt('date', end)
    .order('date', { ascending: true });
  return data ?? [];
}

export async function listRecentTransactions(limit: number): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export type TransactionInput = {
  date: string;
  type: 'receita' | 'despesa';
  category_id: string | null;
  amount: number;
  payment_method_id: string | null;
  notes: string | null;
};

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  if (input.amount <= 0) throw new Error('O valor deve ser maior que zero.');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id: user.id, source: 'manual' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
