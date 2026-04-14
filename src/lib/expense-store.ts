import { promises as fs } from "node:fs";
import path from "node:path";

import type { AnalyticsSummary, BudgetSettings, Expense } from "@/types/expense";

const DATA_DIR = path.join(process.cwd(), "data");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(EXPENSES_FILE);
  } catch {
    await fs.writeFile(EXPENSES_FILE, "[]", "utf-8");
  }
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify({ monthlyBudget: 0 }, null, 2), "utf-8");
  }
}

export async function getExpenses(): Promise<Expense[]> {
  await ensureStore();
  const raw = await fs.readFile(EXPENSES_FILE, "utf-8");
  return (JSON.parse(raw) as Expense[]).sort((a, b) => b.date.localeCompare(a.date));
}

async function saveExpenses(expenses: Expense[]) {
  await ensureStore();
  await fs.writeFile(EXPENSES_FILE, JSON.stringify(expenses, null, 2), "utf-8");
}

export async function addExpense(expense: Expense) {
  const expenses = await getExpenses();
  expenses.push(expense);
  await saveExpenses(expenses);
  return expense;
}

export async function updateExpenseById(id: string, updates: Partial<Expense>) {
  const expenses = await getExpenses();
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  expenses[idx] = {
    ...expenses[idx],
    amount: updates.amount !== undefined ? Number(updates.amount) : expenses[idx].amount,
    category: updates.category ?? expenses[idx].category,
    note: updates.note?.trim() ?? expenses[idx].note,
    date: updates.date ?? expenses[idx].date,
  };
  await saveExpenses(expenses);
  return expenses[idx];
}

export async function deleteExpenseById(id: string) {
  const expenses = await getExpenses();
  const next = expenses.filter((e) => e.id !== id);
  const deleted = next.length !== expenses.length;
  if (deleted) await saveExpenses(next);
  return deleted;
}

export async function getBudgetSettings(): Promise<BudgetSettings> {
  await ensureStore();
  const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
  return JSON.parse(raw) as BudgetSettings;
}

export async function saveBudgetSettings(settings: BudgetSettings) {
  await ensureStore();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthAnalytics(expenses: Expense[], monthKey: string): AnalyticsSummary {
  const [y, m] = monthKey.split("-");
  const year = Number(y);
  const month = Number(m) - 1;
  const totalOverall = expenses.reduce((s, e) => s + e.amount, 0);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) {
    return { weekly: [], categories: [], totalMonth: 0, totalOverall };
  }

  const weekTotals = [0, 0, 0, 0, 0, 0];
  const byCategory = new Map<string, number>();
  let totalMonth = 0;
  const firstDayOffset = new Date(year, month, 1).getDay();

  for (const expense of expenses) {
    const d = new Date(expense.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    totalMonth += expense.amount;
    const weekIndex = Math.floor((d.getDate() + firstDayOffset - 1) / 7);
    if (weekTotals[weekIndex] !== undefined) weekTotals[weekIndex] += expense.amount;
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount);
  }

  const lastUsed = weekTotals.findLastIndex((v) => v > 0);
  const weekCount = lastUsed >= 0 ? Math.max(lastUsed + 1, 4) : 4;

  return {
    weekly: weekTotals.slice(0, weekCount).map((total, i) => ({ week: `Week ${i + 1}`, total })),
    categories: [...byCategory.entries()].map(([category, total]) => ({ category, total })),
    totalMonth: Number(totalMonth.toFixed(2)),
    totalOverall: Number(totalOverall.toFixed(2)),
  };
}
