"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { BarChart3 } from "lucide-react"

export type ExpenseCategorySlice = {
  category: string
  amount: number
}

type ExpenseChartProps = {
  data: ExpenseCategorySlice[] | null
  loading: boolean
  error: string | null
}

const CHART_COLORS = [
  "#D4AF37", // gold
  "#8B5CF6", // violet
  "#22C55E", // emerald
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#EC4899", // pink
  "#14B8A6", // teal
  "#6366F1", // indigo
]

const categoryIcons: Record<string, string> = {
  food: "utensils",
  transport: "car",
  shopping: "shopping-bag",
  bills: "file-text",
  subscriptions: "smartphone",
  entertainment: "film",
  healthcare: "heart-pulse",
  education: "book",
  travel: "plane",
  miscellaneous: "package",
  groceries: "shopping-cart",
  rent: "home",
  utilities: "zap",
  insurance: "shield",
  investments: "trending-up",
  dining: "pizza",
  gym: "dumbbell",
  default: "credit-card",
}

function getCategoryIcon(category: string): string {
  const key = category.toLowerCase()
  for (const [k, v] of Object.entries(categoryIcons)) {
    if (key.includes(k)) return v
  }
  return categoryIcons.default
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: ExpenseCategorySlice }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"
  const item = payload[0]

  return (
    <div className="bg-card border border-[hsl(var(--border))] rounded-xl px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.09)] min-w-[140px]">
      <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase mb-1">
        {item.name}
      </p>
      <p className="font-sora text-sm font-semibold text-foreground">
        {formatCurrency(item.value, currency)}
      </p>
    </div>
  )
}

export function ExpenseChart({ data, loading, error }: ExpenseChartProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        <h3 className="font-jakarta font-semibold text-base mb-4 text-foreground">Expenses by Category</h3>
        <div className="text-sm text-[hsl(var(--destructive))]">{error}</div>
      </div>
    )
  }

  const totalExpenses = data?.reduce((sum, d) => sum + d.amount, 0) ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
      className="bg-card rounded-2xl p-6 border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] h-full flex flex-col relative overflow-hidden"
    >
      <div className="relative z-10 flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h3 className="font-jakarta font-semibold text-base leading-tight text-foreground">Expenses by Category</h3>
          {!loading && data && data.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Total: {formatCurrency(totalExpenses, currency)}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="flex flex-col gap-4 py-6">
            <div className="h-44 w-full rounded-xl bg-[hsl(var(--muted))] animate-pulse shimmer" />
            <div className="space-y-3 w-full mt-4">
              {[80, 60, 70, 50].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded-full bg-[hsl(var(--muted))] animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-[18rem] items-center justify-center rounded-2xl border-dashed border-[hsl(var(--border-strong))] bg-card p-8 text-center">
            <div>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No expenses this month</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Add transactions to see the breakdown</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={100}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "Plus Jakarta Sans" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 mt-2">
              {data.slice(0, 5).map((entry, index) => {
                const pct = totalExpenses > 0 ? ((entry.amount / totalExpenses) * 100).toFixed(0) : "0"
                return (
                  <div key={entry.category} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-muted-foreground capitalize font-medium">
                        {entry.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/70">{pct}%</span>
                      <span className="font-sora font-semibold text-foreground">{formatCurrency(entry.amount, currency)}</span>
                    </div>
                  </div>
                )
              })}
              {data.length > 5 && (
                <p className="text-xs text-muted-foreground/70 text-center pt-2">
                  +{data.length - 5} more categories
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
