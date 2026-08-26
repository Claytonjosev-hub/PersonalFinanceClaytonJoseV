import { createClient } from '@/lib/supabase/server';
import type { PaymentMethod } from '@/lib/ledger/types';

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('payment_methods')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createPaymentMethod(
  input: Pick<PaymentMethod, 'name' | 'due_day' | 'color'>
): Promise<PaymentMethod> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({ ...input, user_id: user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePaymentMethod(
  id: string,
  patch: Partial<Pick<PaymentMethod, 'name' | 'due_day' | 'color'>>
) {
  const supabase = await createClient();
  const { error } = await supabase.from('payment_methods').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  if (error) throw error;
}
