// Shared shapes for the ledger engine. These mirror the DB columns from the
// Plan 1 migration (supabase/migrations/001_schema_and_rls.sql) exactly:
// numeric -> number, date/timestamptz -> string (ISO).

export type MonthKey = {
  year: number;
  month: number; // 1-12
  label: string; // e.g. "Ago/26"
};

export type Parameters = {
  id: string;
  user_id: string;
  start_month: string; // date
  projection_months: number;
  initial_balance: number;
  salary_day: number;
  theme_preference: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  due_day: number | null;
  color: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'receita' | 'despesa';
  color: string | null;
  is_default: boolean;
  archived_at: string | null;
  created_at: string;
};

export type RecurringIncome = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  created_at: string;
};

export type RecurringExpense = {
  id: string;
  user_id: string;
  description: string;
  payment_method_id: string | null;
  category_id: string | null;
  amount: number;
  due_day: number | null;
  created_at: string;
};

export type Debt = {
  id: string;
  user_id: string;
  description: string;
  payment_method_id: string | null;
  category_id: string | null;
  installment_amount: number;
  total_installments: number | null;
  is_recurring: boolean;
  first_installment_date: string; // date
  manually_closed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DebtWithoutSchedule = {
  id: string;
  user_id: string;
  description: string;
  creditor: string;
  open_balance: number;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  type: 'receita' | 'despesa';
  category_id: string | null;
  amount: number;
  payment_method_id: string | null;
  notes: string | null;
  source: 'manual' | 'import_csv';
  created_at: string;
};
