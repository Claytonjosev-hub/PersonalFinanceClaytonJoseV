import { createClient } from '@/lib/supabase/server';
import type { Debt } from '@/lib/ledger/types';

export async function listDebts(): Promise<Debt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('debts')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export type DebtInput = {
  description: string;
  payment_method_id: string | null;
  category_id: string | null;
  installment_amount: number;
  total_installments: number | null;
  is_recurring: boolean;
  first_installment_date: string;
};

// Mirrors the DB check constraint (debts_installments_or_recurring) so the
// user gets an inline form error instead of a raw Postgres error.
export function validateDebtInput(input: DebtInput): string | null {
  if (input.is_recurring && input.total_installments != null) {
    return 'Uma dívida recorrente não deve ter nº de parcelas definido.';
  }
  if (!input.is_recurring && (!input.total_installments || input.total_installments <= 0)) {
    return 'Informe o nº total de parcelas, ou marque como recorrente.';
  }
  return null;
}

export async function createDebt(input: DebtInput): Promise<Debt> {
  const error = validateDebtInput(input);
  if (error) throw new Error(error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error: dbError } = await supabase
    .from('debts')
    .insert({ ...input, user_id: user.id })
    .select('*')
    .single();
  if (dbError) throw dbError;
  return data;
}

export async function updateDebt(id: string, input: DebtInput) {
  const error = validateDebtInput(input);
  if (error) throw new Error(error);

  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from('debts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (dbError) throw dbError;
}

export async function closeDebt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('debts')
    .update({ manually_closed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function reopenDebt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('debts').update({ manually_closed_at: null }).eq('id', id);
  if (error) throw error;
}

export async function archiveDebt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('debts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
