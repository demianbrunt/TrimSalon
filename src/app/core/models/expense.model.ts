export type ExpenseType = 'INVESTMENT' | 'EQUIPMENT' | 'COURSE' | 'OTHER';

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  date: Date;
  type: ExpenseType;
  notes?: string;
  deletedAt?: Date;
}
