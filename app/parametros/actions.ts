'use server';

import { revalidateLedgerPaths } from '@/lib/revalidate';
import { updateParameters } from '@/lib/data/parameters';
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/lib/data/payment-methods';
import { createCategory, updateCategory, archiveCategory } from '@/lib/data/categories';
import {
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '@/lib/data/recurring';
import { parseAmount } from '@/lib/format';

export async function saveConfiguracaoGeral(formData: FormData) {
  await updateParameters({
    start_month: String(formData.get('start_month')),
    projection_months: Number(formData.get('projection_months')),
    initial_balance: parseAmount(formData.get('initial_balance')),
    salary_day: Number(formData.get('salary_day')),
  });
  revalidateLedgerPaths();
}

export async function savePaymentMethod(formData: FormData) {
  const id = formData.get('id');
  const dueDayRaw = formData.get('due_day');
  const input = {
    name: String(formData.get('name')),
    due_day: dueDayRaw ? Number(dueDayRaw) : null,
    color: (formData.get('color') as string) || null,
  };
  if (id) {
    await updatePaymentMethod(String(id), input);
  } else {
    await createPaymentMethod(input);
  }
  revalidateLedgerPaths();
}

export async function deletePaymentMethodAction(formData: FormData) {
  await deletePaymentMethod(String(formData.get('id')));
  revalidateLedgerPaths();
}

export async function saveCategory(formData: FormData) {
  const id = formData.get('id');
  const color = (formData.get('color') as string) || null;
  if (id) {
    await updateCategory(String(id), { name: String(formData.get('name')), color });
  } else {
    await createCategory({
      name: String(formData.get('name')),
      type: formData.get('type') === 'receita' ? 'receita' : 'despesa',
      color,
    });
  }
  revalidateLedgerPaths();
}

export async function archiveCategoryAction(formData: FormData) {
  await archiveCategory(String(formData.get('id')));
  revalidateLedgerPaths();
}

export async function saveRecurringIncome(formData: FormData) {
  const id = formData.get('id');
  const input = {
    description: String(formData.get('description')),
    amount: parseAmount(formData.get('amount')),
  };
  if (id) {
    await updateRecurringIncome(String(id), input);
  } else {
    await createRecurringIncome(input);
  }
  revalidateLedgerPaths();
}

export async function deleteRecurringIncomeAction(formData: FormData) {
  await deleteRecurringIncome(String(formData.get('id')));
  revalidateLedgerPaths();
}

export async function saveRecurringExpense(formData: FormData) {
  const id = formData.get('id');
  const paymentMethodId = (formData.get('payment_method_id') as string) || null;
  const categoryId = (formData.get('category_id') as string) || null;
  const dueDayRaw = formData.get('due_day');
  const input = {
    description: String(formData.get('description')),
    payment_method_id: paymentMethodId,
    category_id: categoryId,
    amount: parseAmount(formData.get('amount')),
    due_day: dueDayRaw ? Number(dueDayRaw) : null,
  };
  if (id) {
    await updateRecurringExpense(String(id), input);
  } else {
    await createRecurringExpense(input);
  }
  revalidateLedgerPaths();
}

export async function deleteRecurringExpenseAction(formData: FormData) {
  await deleteRecurringExpense(String(formData.get('id')));
  revalidateLedgerPaths();
}
