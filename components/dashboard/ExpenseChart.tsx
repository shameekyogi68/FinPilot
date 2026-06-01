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

// Spec colors — no plain blue
const CHART_COLORS = [
  "#7C3AED", // brand-600
  "#059669", // gain
  "#D97706", // warn
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#8B5CF6", // brand-500
  "#10b981", // emerald
  "#64748B", // slate
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: ExpenseCategorySlice }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  if (!active || !payload?.length) return null
  const item = payload[0]

  return (
    <div
      className="bg-[rgba(20,20,25,0.6)] rounded-[10px] px-4 py-3 min-w-[140px]"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      <p className="label-xs text-[#a1a1aa] mb-1">{item.name}</p>
      <p className="text-[14px] font-medium text-[#fafafa] tabular-nums">
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
      <div className="fp-card p-6">
        <h2 className="text-[15px] font-medium text-[#fafafa] mb-4">Expenses by Category</h2>
        <div className="text-[13px] text-[#ef4444]">{error}</div>
      </div>
    )
  }

  const totalExpenses = data?.reduce((sum, d) => sum + d.amount, 0) ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="fp-card p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <BarChart3 size={16} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-[15px] font-medium text-[#fafafa] leading-tight">Expenses by Category</h2>
          {!loading && data && data.length > 0 && (
            <p className="text-[12px] text-[#a1a1aa] mt-0.5 tabular-nums">
              Total: {formatCurrency(totalExpenses, currency)}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 py-2">
            <div className="h-48 w-full rounded-[10px] bg-[rgba(255,255,255,0.05)] animate-pulse" />
            {[80, 60, 70, 50].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-center">
            <div>
              {/* Abstract SVG geometric illustration */}
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
                <rect x="8" y="32" width="12" height="24" rx="3" fill="#EDE9FE" />
                <rect x="26" y="20" width="12" height="36" rx="3" fill="#DDD6FE" />
                <rect x="44" y="12" width="12" height="44" rx="3" fill="#C4B5FD" />
                <rect x="8" y="30" width="48" height="2" rx="1" fill="#a1a1aa" opacity="0.2" />
              </svg>
              <p className="text-[14px] text-[#e4e4e7]">No expenses this month</p>
              <a
                href="/transactions"
                className="text-[13px] text-[#7C3AED] underline mt-1.5 inline-block hover:text-[#6D28D9] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-[4px]"
              >
                Add your first transaction
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 5, right: 32, left: 16, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={90}
                    tick={{
                      fill: "#a1a1aa",
                      fontSize: 12,
                      fontFamily: "Inter var, Inter, system-ui, sans-serif",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={22}>
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

            {/* Category legend rows */}
            <div className="space-y-1 mt-1">
              {data.slice(0, 5).map((entry, index) => {
                const pct = totalExpenses > 0 ? ((entry.amount / totalExpenses) * 100).toFixed(0) : "0"
                return (
                  <div key={entry.category} className="flex items-center justify-between text-[12px] py-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-[#e4e4e7] capitalize">{entry.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#a1a1aa] tabular-nums">{pct}%</span>
                      <span className="font-medium text-[#fafafa] tabular-nums">
                        {formatCurrency(entry.amount, currency)}
                      </span>
                    </div>
                  </div>
                )
              })}
              {data.length > 5 && (
                <p className="text-[11px] text-[#a1a1aa] text-center pt-1">
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
