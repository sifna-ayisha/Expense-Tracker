import { getCurrentMonthKey, getExpenses, getMonthAnalytics } from "@/lib/expense-store";

export async function GET(request: Request) {
  const expenses = await getExpenses();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getCurrentMonthKey();
  const analytics = getMonthAnalytics(expenses, month);
  return Response.json(analytics);
}
