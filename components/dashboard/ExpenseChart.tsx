"use client"

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
  "#7C3AED", // brand-600
  "#059669", // gain
  "#D97706", // warn
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#8B5CF6", // brand-500
  "#10b981", // emerald
  "#64748B", // slate
]

export function ExpenseChart({ data, loading, error }: ExpenseChartProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  if (error) {
    return (
      <div className="fp-card p-6">
        <div className="section-header !mb-5">
          <div className="section-header-icon">
            <BarChart3 size={16} strokeWidth={1.5} />
          </div>
          <h2 className="text-[15px] font-bold text-[#0F0E17]">Expenses by Category</h2>
        </div>
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
      className="fp-card p-6 h-full flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="section-header !mb-5">
          <div className="section-header-icon">
            <BarChart3 size={16} strokeWidth={2} />
          </div>
          <div className="flex-1 flex justify-between items-baseline">
            <h2 className="text-[15px] font-bold text-[#0F0E17]">Expenses by Category</h2>
            {!loading && data && data.length > 0 && (
              <span className="text-[12px] text-[#8B89A0] font-semibold tabular-nums">
                Total: {formatCurrency(totalExpenses, currency)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="space-y-5 py-2">
              {[80, 60, 70, 50].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-20 bg-[#F5F3FF] rounded-full" />
                    <div className="h-3 w-16 bg-[#F5F3FF] rounded-full" />
                  </div>
                  <div className="h-2 w-full bg-[#F5F3FF] rounded-full" />
                </div>
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
                <rect x="8" y="32" width="12" height="24" rx="3" fill="#EDE9FE" />
                <rect x="26" y="20" width="12" height="36" rx="3" fill="#DDD6FE" />
                <rect x="44" y="12" width="12" height="44" rx="3" fill="#C4B5FD" />
                <rect x="8" y="30" width="48" height="2" rx="1" fill="#8B89A0" opacity="0.2" />
              </svg>
              <p className="text-[14px] text-[#4B4963]">No expenses this month</p>
              <a
                href="/transactions"
                className="text-[13px] text-[#7C3AED] underline mt-1.5 inline-block hover:text-[#6D28D9] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-[4px]"
              >
                Add your first transaction
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {data.slice(0, 5).map((entry, index) => {
                const pct = totalExpenses > 0 ? Math.round((entry.amount / totalExpenses) * 100) : 0
                const color = CHART_COLORS[index % CHART_COLORS.length]
                return (
                  <div key={entry.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-[13px] font-bold text-[#0F0E17] capitalize">{entry.category}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#4B4963] tabular-nums">
                        {formatCurrency(entry.amount, currency)}{" "}
                        <span className="text-[#B8B5C9] font-medium">({pct}%)</span>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}88, ${color})`
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer additional info */}
      {!loading && data && data.length > 5 && (
        <p className="text-[11px] text-[#8B89A0] text-center pt-4 border-t border-[rgba(0,0,0,0.04)] mt-4 font-medium">
          +{data.length - 5} more categories
        </p>
      )}
    </motion.div>
  )
}
