import { createClient } from '@/lib/supabase/server';
import type { Parameters } from '@/lib/ledger/types';

export async function getParameters(): Promise<Parameters | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('parameters').select('*').single();
  return data;
}

export async function updateParameters(patch: Partial<Parameters>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('parameters').update(patch).eq('user_id', user.id);
  if (error) throw error;
}
