'use server';

import { revalidatePath } from 'next/cache';
import {
  createInvestment,
  updateInvestment,
  archiveInvestment,
  type InvestmentInput,
  type InvestmentType,
  type IndexType,
} from '@/lib/data/investments';
import { parseAmount } from '@/lib/format';

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return value ? String(value) : null;
}

function num(formData: FormData, key: string): number | null {
  const value = formData.get(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function investmentInputFromFormData(formData: FormData): InvestmentInput {
  const type = formData.get('type') as InvestmentType;
  return {
    type,
    description: String(formData.get('description')),
    institution: str(formData, 'institution'),
    invested_amount: type === 'renda_variavel' ? 0 : parseAmount(formData.get('invested_amount')),
    current_amount: parseAmount(formData.get('current_amount')),
    rate: type === 'renda_fixa' ? str(formData, 'rate') : null,
    index_type: type === 'renda_fixa' ? ((formData.get('index_type') as IndexType) || null) : null,
    liquidity: type !== 'renda_variavel' ? str(formData, 'liquidity') : null,
    grace_period: type === 'renda_fixa' ? str(formData, 'grace_period') : null,
    applied_at: type === 'renda_fixa' ? str(formData, 'applied_at') : null,
    maturity_at: type === 'renda_fixa' ? str(formData, 'maturity_at') : null,
    ticker: type === 'renda_variavel' ? str(formData, 'ticker') : null,
    quantity: type === 'renda_variavel' ? num(formData, 'quantity') : null,
    average_price: type === 'renda_variavel' ? num(formData, 'average_price') : null,
  };
}

export async function saveInvestment(formData: FormData) {
  const id = formData.get('id');
  const input = investmentInputFromFormData(formData);
  if (id) {
    await updateInvestment(String(id), input);
  } else {
    await createInvestment(input);
  }
  revalidatePath('/investimentos');
}

export async function archiveInvestmentAction(formData: FormData) {
  await archiveInvestment(String(formData.get('id')));
  revalidatePath('/investimentos');
}
