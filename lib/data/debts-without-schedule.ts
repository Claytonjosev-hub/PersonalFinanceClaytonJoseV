import { createClient } from '@/lib/supabase/server';
import type { DebtWithoutSchedule } from '@/lib/ledger/types';

export async function listDebtsWithoutSchedule(): Promise<DebtWithoutSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('debts_without_schedule')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export type DebtWithoutScheduleInput = {
  description: string;
  creditor: string;
  open_balance: number;
  notes: string | null;
};

export async function createDebtWithoutSchedule(
  input: DebtWithoutScheduleInput
): Promise<DebtWithoutSchedule> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('debts_without_schedule')
    .insert({ ...input, user_id: user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateDebtWithoutSchedule(id: string, input: DebtWithoutScheduleInput) {
  const supabase = await createClient();
  const { error } = await supabase.from('debts_without_schedule').update(input).eq('id', id);
  if (error) throw error;
}

export async function archiveDebtWithoutSchedule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('debts_without_schedule')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
