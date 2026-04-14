import { deleteExpenseById, updateExpenseById } from "@/lib/expense-store";
import { EXPENSE_CATEGORIES, type Expense } from "@/types/expense";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Expense>;

  if (body.amount !== undefined && Number(body.amount) <= 0) {
    return Response.json({ error: "Amount must be greater than 0." }, { status: 400 });
  }
  if (body.category && !EXPENSE_CATEGORIES.includes(body.category)) {
    return Response.json({ error: "Valid category is required." }, { status: 400 });
  }

  const expense = await updateExpenseById(id, body);
  if (!expense) return Response.json({ error: "Expense not found." }, { status: 404 });
  return Response.json({ expense });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const ok = await deleteExpenseById(id);
  if (!ok) return Response.json({ error: "Expense not found." }, { status: 404 });
  return Response.json({ success: true });
}
