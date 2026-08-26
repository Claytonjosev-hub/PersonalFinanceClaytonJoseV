import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/ledger/types';

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createCategory(
  input: Pick<Category, 'name' | 'type' | 'color'>
): Promise<Category> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, user_id: user.id, is_default: false })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'color'>>
) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) throw error;
}

// Categories are archived, never hard-deleted, so past transactions keep
// showing their original category (spec 01 §3).
export async function archiveCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
