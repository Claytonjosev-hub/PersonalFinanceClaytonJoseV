'use server';

import { revalidatePath } from 'next/cache';
import {
  createDebt,
  updateDebt,
  closeDebt,
  reopenDebt,
  archiveDebt,
  type DebtInput,
} from '@/lib/data/debts';
import {
  createDebtWithoutSchedule,
  updateDebtWithoutSchedule,
  archiveDebtWithoutSchedule,
  type DebtWithoutScheduleInput,
} from '@/lib/data/debts-without-schedule';
import { parseAmount } from '@/lib/format';

function debtInputFromFormData(formData: FormData): DebtInput {
  const isRecurring = formData.get('is_recurring') === 'on';
  const totalInstallmentsRaw = formData.get('total_installments');
  return {
    description: String(formData.get('description')),
    payment_method_id: (formData.get('payment_method_id') as string) || null,
    category_id: (formData.get('category_id') as string) || null,
    installment_amount: parseAmount(formData.get('installment_amount')),
    total_installments: isRecurring
      ? null
      : totalInstallmentsRaw
        ? Number(totalInstallmentsRaw)
        : null,
    is_recurring: isRecurring,
    first_installment_date: String(formData.get('first_installment_date')),
  };
}

export async function saveDebt(formData: FormData) {
  const id = formData.get('id');
  const input = debtInputFromFormData(formData);
  if (id) {
    await updateDebt(String(id), input);
  } else {
    await createDebt(input);
  }
  revalidatePath('/dividas');
}

export async function closeDebtAction(formData: FormData) {
  await closeDebt(String(formData.get('id')));
  revalidatePath('/dividas');
}

export async function reopenDebtAction(formData: FormData) {
  await reopenDebt(String(formData.get('id')));
  revalidatePath('/dividas');
}

export async function archiveDebtAction(formData: FormData) {
  await archiveDebt(String(formData.get('id')));
  revalidatePath('/dividas');
}

// --- Dívidas sem cronograma ---

function debtWithoutScheduleInputFromFormData(formData: FormData): DebtWithoutScheduleInput {
  return {
    description: String(formData.get('description')),
    creditor: String(formData.get('creditor')),
    open_balance: parseAmount(formData.get('open_balance')),
    notes: (formData.get('notes') as string) || null,
  };
}

export async function saveDebtWithoutSchedule(formData: FormData) {
  const id = formData.get('id');
  const input = debtWithoutScheduleInputFromFormData(formData);
  if (id) {
    await updateDebtWithoutSchedule(String(id), input);
  } else {
    await createDebtWithoutSchedule(input);
  }
  revalidatePath('/dividas');
}

export async function archiveDebtWithoutScheduleAction(formData: FormData) {
  await archiveDebtWithoutSchedule(String(formData.get('id')));
  revalidatePath('/dividas');
}
