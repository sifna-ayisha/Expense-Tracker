import ExpenseTracker from "@/components/expense-tracker";
import { getBudgetSettings, getCurrentMonthKey, getExpenses, getMonthAnalytics } from "@/lib/expense-store";

export default async function Home() {
  const expenses = await getExpenses();
  const defaultMonth = getCurrentMonthKey();
  const analytics = getMonthAnalytics(expenses, defaultMonth);
  const budget = await getBudgetSettings();

  return (
    <ExpenseTracker
      initialExpenses={expenses}
      initialAnalytics={analytics}
      initialBudget={budget.monthlyBudget}
      defaultMonth={defaultMonth}
    />
  );
}
