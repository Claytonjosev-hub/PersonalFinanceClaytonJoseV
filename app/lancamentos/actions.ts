'use server';

import { createTransaction, deleteTransaction, type TransactionInput } from '@/lib/data/transactions';
import { parseAmount } from '@/lib/format';
import { revalidateLedgerPaths } from '@/lib/revalidate';

export async function saveTransaction(formData: FormData) {
  const input: TransactionInput = {
    date: String(formData.get('date')),
    type: formData.get('type') === 'receita' ? 'receita' : 'despesa',
    category_id: (formData.get('category_id') as string) || null,
    amount: parseAmount(formData.get('amount')),
    payment_method_id: (formData.get('payment_method_id') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };
  await createTransaction(input);
  revalidateLedgerPaths();
}

export async function deleteTransactionAction(formData: FormData) {
  await deleteTransaction(String(formData.get('id')));
  revalidateLedgerPaths();
}
