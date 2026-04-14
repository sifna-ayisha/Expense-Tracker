"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";

import { EXPENSE_CATEGORIES, type AnalyticsSummary, type Expense } from "@/types/expense";

const ExpenseCharts = dynamic(() => import("@/components/expense-charts"), { ssr: false });

export default function ExpenseTracker({
  initialExpenses,
  initialAnalytics,
  initialBudget,
  defaultMonth,
}: {
  initialExpenses: Expense[];
  initialAnalytics: AnalyticsSummary;
  initialBudget: number;
  defaultMonth: string;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [budget, setBudget] = useState(initialBudget);
  const [budgetInput, setBudgetInput] = useState(String(initialBudget || ""));
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const monthOptions = useMemo(() => {
    const values = new Set([defaultMonth]);
    expenses.forEach((e) => values.add(e.date.slice(0, 7)));
    return [...values].sort((a, b) => b.localeCompare(a));
  }, [defaultMonth, expenses]);

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  const isOverspend = budget > 0 && analytics.totalMonth > budget;

  async function refreshData(month = selectedMonth) {
    const [expRes, analyticsRes] = await Promise.all([
      fetch("/api/expenses", { cache: "no-store" }),
      fetch(`/api/analytics/month?month=${month}`, { cache: "no-store" }),
    ]);
    const expData = (await expRes.json()) as { expenses: Expense[] };
    const anaData = (await analyticsRes.json()) as AnalyticsSummary;
    setExpenses(expData.expenses);
    setAnalytics(anaData);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { amount: Number(amount), category, date, note };
    const response = editingId
      ? await fetch(`/api/expenses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!response.ok) return;
    resetForm();
    await refreshData();
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await refreshData();
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date);
    setNote(expense.note);
  }

  function resetForm() {
    setEditingId(null);
    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
  }

  async function saveBudget() {
    const response = await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyBudget: Number(budgetInput || 0) }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { monthlyBudget: number };
    setBudget(data.monthlyBudget);
  }

  function download(type: "csv" | "xls") {
    const header = ["Date", "Category", "Note", "Amount"];
    const rows = filteredExpenses.map((x) => [x.date, x.category, x.note || "", String(x.amount)]);
    const separator = type === "csv" ? "," : "\t";
    const content = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(separator))
      .join("\n");
    const blob = new Blob([content], {
      type: type === "csv" ? "text/csv;charset=utf-8;" : "application/vnd.ms-excel",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${selectedMonth}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-3xl border border-violet-100/80 bg-white/80 p-6 shadow-xl shadow-violet-200/40 backdrop-blur-sm">
        <h1 className="bg-gradient-to-r from-indigo-800 via-violet-700 to-amber-600 bg-clip-text text-3xl font-extrabold text-transparent">
          Daily Expense Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600">Edit, filter by month, export, and track budget alerts.</p>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-violet-100 bg-white/85 p-4 shadow-lg shadow-violet-100/50 backdrop-blur-sm">
          <h2 className="mb-3 text-lg font-semibold">{editingId ? "Edit Expense" : "Add Expense"}</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Amount" value={amount} onChange={setAmount} type="number" />
            <Field label="Date" value={date} onChange={setDate} type="date" />
            <div>
              <label className="mb-1 block text-sm text-slate-600">Category</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Note" value={note} onChange={setNote} />
            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-3 py-2 font-semibold text-white shadow-md shadow-violet-200 transition hover:from-indigo-800 hover:to-violet-800">
              {editingId ? "Update Expense" : "Add Expense"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </form>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white/85 p-4 shadow-lg shadow-violet-100/50 backdrop-blur-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Month Filter</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                value={selectedMonth}
                onChange={async (e) => {
                  const month = e.target.value;
                  setSelectedMonth(month);
                  await refreshData(month);
                }}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Monthly Budget</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  type="number"
                  min="0"
                />
                <button
                  onClick={saveBudget}
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-violet-800 to-indigo-800 px-3 py-2 text-white transition hover:from-violet-900 hover:to-indigo-900"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              isOverspend
                ? "bg-rose-50 text-rose-700 border border-rose-100"
                : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}
          >
            {budget <= 0
              ? "Set a monthly budget to enable overspend alerts."
              : isOverspend
                ? `Overspend alert: ${formatCurrency(analytics.totalMonth - budget)} over budget for ${selectedMonth}.`
                : `Budget safe: ${formatCurrency(budget - analytics.totalMonth)} remaining for ${selectedMonth}.`}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Metric title="Total" value={formatCurrency(analytics.totalOverall)} />
            <Metric title={`Month (${selectedMonth})`} value={formatCurrency(analytics.totalMonth)} />
            <Metric title="Entries" value={String(expenses.length)} />
          </div>

          <ExpenseCharts
            key={selectedMonth}
            weekly={analytics.weekly}
            categories={analytics.categories}
            monthKey={selectedMonth}
          />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-violet-100 bg-white/85 p-4 shadow-lg shadow-violet-100/50 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Expense List ({selectedMonth})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => download("csv")}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold transition hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => download("xls")}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold transition hover:bg-slate-50"
            >
              Export Excel
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses for selected month.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Note</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="rounded-xl border border-slate-100 bg-white shadow-sm">
                    <td className="rounded-l-xl px-2 py-2">{expense.date}</td>
                    <td className="px-2 py-2">{expense.category}</td>
                    <td className="px-2 py-2">{expense.note || "-"}</td>
                    <td className="px-2 py-2 font-semibold">{formatCurrency(expense.amount)}</td>
                    <td className="rounded-r-xl px-2 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(expense)}
                          className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={label !== "Note"}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
