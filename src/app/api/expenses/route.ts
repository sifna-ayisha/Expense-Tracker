import { randomUUID } from "node:crypto";

import { addExpense, getExpenses } from "@/lib/expense-store";
import { EXPENSE_CATEGORIES, type Expense } from "@/types/expense";

export async function GET() {
  const expenses = await getExpenses();
  return Response.json({ expenses });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Expense>;
  if (!body.amount || Number(body.amount) <= 0) {
    return Response.json({ error: "Amount must be greater than 0." }, { status: 400 });
  }
  if (!body.date) {
    return Response.json({ error: "Date is required." }, { status: 400 });
  }
  if (!body.category || !EXPENSE_CATEGORIES.includes(body.category)) {
    return Response.json({ error: "Valid category is required." }, { status: 400 });
  }

  const expense: Expense = {
    id: randomUUID(),
    amount: Number(body.amount),
    date: body.date,
    category: body.category,
    note: body.note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };

  await addExpense(expense);
  return Response.json({ expense }, { status: 201 });
}
