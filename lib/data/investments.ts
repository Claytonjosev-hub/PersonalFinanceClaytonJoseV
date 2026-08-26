import { createClient } from '@/lib/supabase/server';

export type InvestmentType = 'renda_fixa' | 'renda_variavel' | 'reserva_emergencia';
export type IndexType = 'cdi' | 'ipca' | 'prefixado';

export type Investment = {
  id: string;
  user_id: string;
  type: InvestmentType;
  description: string;
  institution: string | null;
  invested_amount: number;
  current_amount: number;
  rate: string | null;
  index_type: IndexType | null;
  liquidity: string | null;
  grace_period: string | null;
  applied_at: string | null;
  maturity_at: string | null;
  ticker: string | null;
  quantity: number | null;
  average_price: number | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentInput = {
  type: InvestmentType;
  description: string;
  institution: string | null;
  invested_amount: number;
  current_amount: number;
  rate: string | null;
  index_type: IndexType | null;
  liquidity: string | null;
  grace_period: string | null;
  applied_at: string | null;
  maturity_at: string | null;
  ticker: string | null;
  quantity: number | null;
  average_price: number | null;
};

export async function listInvestments(): Promise<Investment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('investments')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createInvestment(input: InvestmentInput): Promise<Investment> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('investments')
    .insert({ ...input, user_id: user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvestment(id: string, input: InvestmentInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('investments')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function archiveInvestment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('investments')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
