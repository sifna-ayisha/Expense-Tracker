export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Food",
  "Medicine",
  "Current Bill",
  "Gas",
  "Transport",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
  createdAt: string;
};

export type WeeklyAnalytics = {
  week: string;
  total: number;
};

export type CategoryAnalytics = {
  category: string;
  total: number;
};

export type AnalyticsSummary = {
  weekly: WeeklyAnalytics[];
  categories: CategoryAnalytics[];
  totalMonth: number;
  totalOverall: number;
};

export type BudgetSettings = {
  monthlyBudget: number;
};
