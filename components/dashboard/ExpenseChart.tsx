"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type ExpenseCategorySlice = {
  category: string
  amount: number
}

type ExpenseChartProps = {
  data: ExpenseCategorySlice[] | null
  loading: boolean
  error: string | null
}

const COLORS = ["#22c55e", "#fb7185", "#f59e0b", "#38bdf8", "#a855f7", "#f43f5e", "#0ea5e9"]

export function ExpenseChart({ data, loading, error }: ExpenseChartProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "USD"
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-h-[28rem]">
      <CardHeader>
        <CardTitle>Expenses by category</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-3">
            <div className="h-72 animate-pulse rounded-3xl bg-muted" />
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-4 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
            No expenses this month.
          </div>
        ) : (
          <div className="h-[28rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={2}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((value: unknown) => {
                    const numeric =
                      typeof value === "number"
                        ? value
                        : typeof value === "string"
                        ? Number(value)
                        : NaN
                    return Number.isNaN(numeric)
                      ? String(value)
                      : formatCurrency(numeric, currency)
                  }) as any}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
