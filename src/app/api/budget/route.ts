import { getBudgetSettings, saveBudgetSettings } from "@/lib/expense-store";

export async function GET() {
  return Response.json(await getBudgetSettings());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { monthlyBudget?: number };
  const monthlyBudget = Number(body.monthlyBudget ?? 0);
  if (Number.isNaN(monthlyBudget) || monthlyBudget < 0) {
    return Response.json({ error: "Budget must be 0 or greater." }, { status: 400 });
  }
  const settings = { monthlyBudget: Number(monthlyBudget.toFixed(2)) };
  await saveBudgetSettings(settings);
  return Response.json(settings);
}
