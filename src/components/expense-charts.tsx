"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CategoryAnalytics, WeeklyAnalytics } from "@/types/expense";

const COLORS = ["#4f46e5", "#7c3aed", "#d97706", "#0f766e", "#be185d", "#374151", "#1d4ed8"];

export default function ExpenseCharts({
  weekly,
  categories,
  monthKey,
}: {
  weekly: WeeklyAnalytics[];
  categories: CategoryAnalytics[];
  monthKey: string;
}) {
  const pieData = categories.length ? categories : [{ category: "No Data", total: 1 }];

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-violet-100 bg-white/75 p-3 shadow-sm shadow-violet-100/60">
        <p className="mb-2 text-sm font-semibold text-slate-600">Week-wise Expenses</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={`bar-${monthKey}`} data={weekly}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-violet-100 bg-white/75 p-3 shadow-sm shadow-violet-100/60">
        <p className="mb-2 text-sm font-semibold text-slate-600">Category Split</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`pie-${monthKey}`}>
              <Pie data={pieData} dataKey="total" nameKey="category" outerRadius={90}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
