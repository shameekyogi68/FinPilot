"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { TrendingUp, BarChart2, Calendar, PieChart } from "lucide-react"

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]

type MonthlySummary = { month: number; year: number; monthLabel: string; income: number; expense: number; net: number; savingsRate: number }
type TrendEntry = { month: string; year: number; income: number; expense: number; net: number; savingsRate: number }
type YearlyTrendEntry = { month: string; year: number; expense: number }
type CategoryBreakdown = { category: string; amount: number }[]
type DailySpendingEntry = { day: number; amount: number }[]
type AnalyticsResponse = { month: number; year: number; monthlySummary: MonthlySummary; last6MonthsTrend: TrendEntry[]; yearlyTrend: YearlyTrendEntry[]; categoryBreakdown: CategoryBreakdown; dailySpending: DailySpendingEntry }

// Custom Tooltip
interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ dataKey: string; color: string; value: number; name: string }>
  label?: string
  currency: string
}

function ChartTooltip({ active, payload, label, currency }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[rgba(20,20,25,0.6)] rounded-[10px] px-4 py-3 min-w-[160px]" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.06)" }}>
      <p className="label-xs text-[#a1a1aa] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="capitalize text-[#a1a1aa]">{p.dataKey}:</span>
          <span className="font-medium text-[#fafafa] tabular-nums">{formatCurrency(Number(p.value), currency)}</span>
        </div>
      ))}
    </div>
  )
}

// Heatmap heat color
function heatColor(intensity: number): string {
  if (intensity === 0) return "rgba(212, 175, 55, 0.04)"
  const r = Math.round(212 - intensity * 100)
  const g = Math.round(175 - intensity * 80)
  const b = Math.round(55 - intensity * 30)
  return `rgba(${r},${g},${b},${0.15 + intensity * 0.7})`
}

export default function AnalyticsPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => cur - i)
  }, [])

  const fetchAnalytics = async (m: number, y: number) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics?month=${m}&year=${y}`)
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || "Unable to load analytics")
      setData(payload)
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load analytics"); setData(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAnalytics(month, year) }, [month, year])

  const heatmapMax = useMemo(() => data?.dailySpending.reduce((max, d) => Math.max(max, d.amount), 0) ?? 1, [data])

  const summaryMetrics = [
    { label: "Income", value: data ? formatCurrency(data.monthlySummary.income, currency) : "—", color: "text-[hsl(var(--income))]" },
    { label: "Expenses", value: data ? formatCurrency(data.monthlySummary.expense, currency) : "—", color: "text-[hsl(var(--destructive))]" },
    { label: "Net", value: data ? formatCurrency(data.monthlySummary.net, currency) : "—", color: "text-[hsl(var(--primary))]" },
    { label: "Savings Rate", value: data ? `${data.monthlySummary.savingsRate.toFixed(1)}%` : "—", color: "text-[hsl(var(--warning))]" },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen space-y-6">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <h1 className="text-[22px] font-medium text-[#fafafa] leading-tight">Analytics</h1>
              <p className="text-[14px] text-[#a1a1aa] mt-0.5">Spending trends and monthly breakdowns</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 px-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,25,0.6)] text-[13px] text-[#e4e4e7] font-medium outline-none hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]"
              >
                {monthNames.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-9 px-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,25,0.6)] text-[13px] text-[#e4e4e7] font-medium outline-none hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]"
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button
                onClick={() => fetchAnalytics(month, year)}
                disabled={loading}
                className="h-9 px-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,25,0.6)] text-[13px] text-[#e4e4e7] font-medium hover:border-[rgba(255,255,255,0.14)] hover:text-[#fafafa] transition-all duration-150 disabled:opacity-50"
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[10px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.15)] p-4 text-[#ef4444] text-[13px]"
            >
              <p className="font-medium">Unable to load analytics</p>
              <p className="opacity-75">{error}</p>
            </motion.div>
          )}

          {/* Monthly Summary + Category Breakdown */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Summary metrics */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                <TrendingUp size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
                <h2 className="text-[15px] font-medium text-[#fafafa]">Monthly Summary</h2>
                {data && <span className="text-[12px] text-[#a1a1aa] ml-auto">{data.monthlySummary.monthLabel}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {summaryMetrics.map((m) => (
                  <div key={m.label} className="rounded-[10px] p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="label-xs text-[#a1a1aa] mb-1.5">{m.label}</p>
                    <p className={`text-[18px] font-medium tabular-nums ${m.color}`}>
                      {loading ? <span className="inline-block w-20 h-5 rounded-[6px] bg-[rgba(255,255,255,0.06)] animate-pulse" /> : m.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Category breakdown with horizontal bars */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                <PieChart size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
                <h2 className="text-[15px] font-medium text-[#fafafa]">Category Breakdown</h2>
              </div>
              {loading || !data ? (
                <div className="space-y-3">
                  {[80, 60, 70, 50, 40].map((w, i) => (
                    <div key={i} className="h-8 rounded-[8px] bg-[rgba(255,255,255,0.05)] animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : data.categoryBreakdown.length === 0 ? (
                <p className="text-[13px] text-[#a1a1aa]">No spending data this month.</p>
              ) : (
                <div className="space-y-3">
                  {data.categoryBreakdown.slice(0, 5).map((cat, i) => {
                    const total = data.categoryBreakdown.reduce((s, c) => s + c.amount, 0)
                    const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(0) : "0"
                    const COLORS = ["#7C3AED", "#059669", "#D97706", "#06B6D4", "#EC4899"]
                    const color = COLORS[i % COLORS.length]
                    return (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="capitalize text-[#e4e4e7] font-medium">{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#a1a1aa] tabular-nums">{pct}%</span>
                            <span className="font-medium text-[#fafafa] tabular-nums">{formatCurrency(cat.amount, currency)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                            className="h-full rounded-full"
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* 6-month area chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <TrendingUp size={15} strokeWidth={1.5} className="text-[#059669]" aria-hidden="true" />
              <h2 className="text-[15px] font-medium text-[#fafafa]">6-Month Income vs Expenses</h2>
            </div>
            <div className="h-72">
              {loading || !data ? (
                <div className="h-full w-full rounded-2xl bg-bg-[hsl(var(--muted))] animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.last6MonthsTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4caf82" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4caf82" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e06b6b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e06b6b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "currentColor", opacity: 0.5, fontSize: 11 }} axisLine={false} tickLine={false} className="text-muted-foreground-foreground" />
                    <YAxis 
                      tickFormatter={(v) => {
                        const num = Number(v)
                        if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`
                        if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
                        if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`
                        return `₹${num}`
                      }} 
                      tick={{ fill: "currentColor", opacity: 0.5, fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false} 
                      width={50}
                      className="text-muted-foreground-foreground"
                    />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Area type="monotone" dataKey="income" stroke="#4caf82" strokeWidth={3} fill="url(#incomeGrad)" dot={false} />
                    <Area type="monotone" dataKey="expense" stroke="#e06b6b" strokeWidth={3} fill="url(#expenseGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Yearly bar chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <BarChart2 size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
              <h2 className="text-[15px] font-medium text-[#fafafa]">Yearly Expense Trend ({year})</h2>
            </div>
            <div className="h-64">
              {loading || !data ? (
                <div className="h-full w-full rounded-2xl bg-[hsl(var(--border))] animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.yearlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c26b48" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#a8553e" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "currentColor", opacity: 0.5, fontSize: 11 }} axisLine={false} tickLine={false} className="text-muted-foreground" />
                    <YAxis 
                      tickFormatter={(v) => {
                        const num = Number(v)
                        if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`
                        if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
                        if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`
                        return `₹${num}`
                      }} 
                      tick={{ fill: "currentColor", opacity: 0.5, fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false}
                      width={50}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Bar dataKey="expense" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Daily spending heatmap */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <Calendar size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
              <h2 className="text-[15px] font-medium text-[#fafafa]">Daily Spending Heatmap</h2>
            </div>
            {loading || !data ? (
              <div className="h-40 w-full rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
            ) : data.dailySpending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daily data for this month.</p>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2 text-center">
                  {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, idx) => {
                    const day = idx + 1
                    const entry = data.dailySpending.find((e) => e.day === day)
                    const intensity = entry ? Math.max(0.1, Math.min(1, entry.amount / heatmapMax)) : 0
                    return (
                      <motion.div
                        key={day}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.01 }}
                        title={entry ? `${day}: ${formatCurrency(entry.amount, currency)}` : `${day}: No spending`}
                        className="rounded-2xl text-center py-2 text-[10px] font-semibold tracking-[0.1em] uppercase cursor-default transition-transform hover:scale-110"
                        style={{ background: heatColor(intensity) }}
                      >
                        <span className="block opacity-70 text-foreground">{day}</span>
                        {entry && (
                          <span className="block text-[8px] opacity-60 font-medium text-foreground">
                            {(entry.amount / 1000).toFixed(0)}k
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                  <span>Less</span>
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                    <div key={v} className="w-5 h-5 rounded-2xl" style={{ background: heatColor(v) }} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            )}
          </motion.div>
      </div>
    </ErrorBoundary>
  )
}
