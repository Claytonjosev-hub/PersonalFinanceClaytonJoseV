import { createClient } from '@/lib/supabase/server';
import type { RecurringIncome, RecurringExpense } from '@/lib/ledger/types';

export async function listRecurringIncomes(): Promise<RecurringIncome[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recurring_incomes')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createRecurringIncome(
  input: Pick<RecurringIncome, 'description' | 'amount'>
): Promise<RecurringIncome> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('recurring_incomes')
    .insert({ ...input, user_id: user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecurringIncome(
  id: string,
  patch: Partial<Pick<RecurringIncome, 'description' | 'amount'>>
) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_incomes').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteRecurringIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_incomes').delete().eq('id', id);
  if (error) throw error;
}

export async function listRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recurring_expenses')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createRecurringExpense(
  input: Pick<
    RecurringExpense,
    'description' | 'payment_method_id' | 'category_id' | 'amount' | 'due_day'
  >
): Promise<RecurringExpense> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({ ...input, user_id: user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecurringExpense(
  id: string,
  patch: Partial<
    Pick<RecurringExpense, 'description' | 'payment_method_id' | 'category_id' | 'amount' | 'due_day'>
  >
) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_expenses').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteRecurringExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) throw error;
}
