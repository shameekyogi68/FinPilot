"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, ReferenceLine, Cell
} from "recharts"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { TrendingUp, BarChart2, Calendar, PieChart, Wallet } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  payload?: Array<{ dataKey?: string; color?: string; value?: number; name?: string }>
  label?: string
  currency: string
}

function ChartTooltip({ active, payload, label, currency }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div 
      className="bg-white rounded-[10px] px-4 py-3 min-w-[160px] border border-edge-subtle" 
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)" }}
    >
      <p className="label-xs text-[#8B89A0] mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p, idx) => {
          const isIncome = p.dataKey === "income"
          const color = isIncome ? "#7C3AED" : "#DC2626"
          const name = p.name || p.dataKey || (isIncome ? "income" : "expense")
          const value = p.value ?? 0
          return (
            <div key={p.dataKey || idx} className="flex items-center justify-between gap-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="capitalize text-[#4B4963] font-medium">{name}:</span>
              </div>
              <span className="font-medium text-[#0F0E17] tabular-nums">{formatCurrency(Number(value), currency)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Heatmap colors based on 5 stops from edge-subtle to brand-700
function getHeatmapColor(amount: number, max: number): string {
  if (amount <= 0) return "rgba(0,0,0,0.04)"
  const ratio = amount / max
  if (ratio <= 0.25) return "#EDE9FE" // Stop 1: brand-100
  if (ratio <= 0.5)  return "#DDD6FE" // Stop 2: brand-200
  if (ratio <= 0.75) return "#A78BFA" // Stop 3: brand-400
  if (ratio <= 0.9)  return "#7C3AED" // Stop 4: brand-600
  return "#6D28D9"                    // Stop 5: brand-700
}

export default function AnalyticsPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ day: number; amount: number; x: number; y: number } | null>(null)
  
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

  const refLines = useMemo(() => {
    if (!data?.last6MonthsTrend?.length) return [10000, 30000, 50000]
    const maxVal = Math.max(...data.last6MonthsTrend.flatMap(d => [d.income, d.expense]))
    if (maxVal === 0) return [10000, 30000, 50000]
    return [
      Math.round((maxVal * 0.25) / 1000) * 1000,
      Math.round((maxVal * 0.5) / 1000) * 1000,
      Math.round((maxVal * 0.75) / 1000) * 1000,
    ]
  }, [data])

  const summaryMetrics = [
    { label: "Income", value: data ? formatCurrency(data.monthlySummary.income, currency) : "—", color: "#059669", icon: TrendingUp, desc: "Total incoming money" },
    { label: "Expenses", value: data ? formatCurrency(data.monthlySummary.expense, currency) : "—", color: "#DC2626", icon: BarChart2, desc: "Total outgoing money" },
    { label: "Net Balance", value: data ? formatCurrency(data.monthlySummary.net, currency) : "—", color: "#7C3AED", icon: Wallet, desc: "Total savings/deficit" },
    { label: "Savings Rate", value: data ? `${data.monthlySummary.savingsRate.toFixed(1)}%` : "—", color: "#D97706", icon: PieChart, desc: "Percentage of income saved" },
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
              <h1 className="text-[22px] font-medium text-[#0F0E17] leading-tight">Spending Analytics</h1>
              <p className="text-[14px] text-[#8B89A0] mt-0.5 font-sans">Spending trends and monthly breakdowns</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-9 w-[125px] bg-white/70 border-[rgba(0,0,0,0.06)] text-[13px] text-[#4B4963] font-medium hover:border-[rgba(0,0,0,0.14)] focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)] rounded-[10px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[rgba(0,0,0,0.06)] shadow-elevated rounded-[10px]">
                  {monthNames.map((n, i) => (
                    <SelectItem key={n} value={String(i + 1)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-9 w-[100px] bg-white/70 border-[rgba(0,0,0,0.06)] text-[13px] text-[#4B4963] font-medium hover:border-[rgba(0,0,0,0.14)] focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)] rounded-[10px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[rgba(0,0,0,0.06)] shadow-elevated rounded-[10px]">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {String(y)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={() => fetchAnalytics(month, year)}
                disabled={loading}
                className="h-9 px-3 rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-white/70 text-[13px] text-[#4B4963] font-medium hover:border-[rgba(0,0,0,0.14)] hover:text-[#0F0E17] transition-all duration-150 disabled:opacity-50"
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
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[rgba(0,0,0,0.06)]">
                <TrendingUp size={15} strokeWidth={1.5} className="text-[#4B4963]" aria-hidden="true" />
                <h2 className="text-[15px] font-medium text-[#0F0E17]">Monthly Summary</h2>
                {data && <span className="text-[12px] text-[#8B89A0] ml-auto">{data.monthlySummary.monthLabel}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {summaryMetrics.map((m) => {
                  const Icon = m.icon
                  return (
                    <div 
                      key={m.label} 
                      className="stat-card flex flex-col gap-2"
                      style={{ borderLeft: `3px solid ${m.color}` }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} strokeWidth={1.5} className="text-[#8B89A0]" aria-hidden="true" />
                        <span className="label-xs text-[#8B89A0]">{m.label}</span>
                      </div>
                      <p className="metric-value text-[#0F0E17] tabular-nums">
                        {loading ? <span className="inline-block w-20 h-6 rounded-[6px] bg-[#F5F3FF] animate-pulse" /> : m.value}
                      </p>
                      <p className="text-[11px] text-[#8B89A0] leading-tight">{m.desc}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Category breakdown with horizontal bars */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[rgba(0,0,0,0.06)]">
                <PieChart size={15} strokeWidth={1.5} className="text-[#4B4963]" aria-hidden="true" />
                <h2 className="text-[15px] font-medium text-[#0F0E17]">Category Breakdown</h2>
              </div>
              {loading || !data ? (
                <div className="space-y-3">
                  {[80, 60, 70, 50, 40].map((w, i) => (
                    <div key={i} className="h-8 rounded-[8px] bg-[#F8F7FF] animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : data.categoryBreakdown.length === 0 ? (
                <p className="text-[13px] text-[#8B89A0]">No spending data this month.</p>
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
                            <span className="capitalize text-[#4B4963] font-medium">{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#8B89A0] tabular-nums">{pct}%</span>
                            <span className="font-medium text-[#0F0E17] tabular-nums">{formatCurrency(cat.amount, currency)}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
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
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <TrendingUp size={15} strokeWidth={1.5} className="text-[#7C3AED]" aria-hidden="true" />
              <h2 className="text-[15px] font-medium text-[#0F0E17]">6-Month Income vs Expenses</h2>
            </div>
            <div className="h-72">
              {loading || !data ? (
                <div className="h-full w-full rounded-2xl bg-[#F8F7FF] animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.last6MonthsTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    {refLines.map((val) => (
                      <ReferenceLine
                        key={val}
                        y={val}
                        stroke="rgba(0,0,0,0.06)"
                        strokeDasharray="4 2"
                      />
                    ))}
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: "#8B89A0", fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tickFormatter={(v) => {
                        const num = Number(v)
                        if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`
                        if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
                        if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`
                        return `₹${num}`
                      }} 
                      tick={{ fill: "#8B89A0", fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                      width={55}
                    />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#7C3AED" 
                      strokeWidth={2} 
                      fill="url(#brandGrad)" 
                      dot={{ r: 3, fill: "white", stroke: "#7C3AED", strokeWidth: 2 }} 
                      activeDot={{ r: 5, fill: "#7C3AED", stroke: "white", strokeWidth: 1.5 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#DC2626" 
                      strokeWidth={2} 
                      fill="none" 
                      strokeDasharray="4 2" 
                      dot={false}
                      activeDot={{ r: 4, fill: "#DC2626", stroke: "white", strokeWidth: 1 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Yearly bar chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <BarChart2 size={15} strokeWidth={1.5} className="text-[#4B4963]" aria-hidden="true" />
              <h2 className="text-[15px] font-medium text-[#0F0E17]">Yearly Expense Trend ({year})</h2>
            </div>
            <div className="h-64">
              {loading || !data ? (
                <div className="h-full w-full rounded-2xl bg-[#F8F7FF] animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.yearlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: "#8B89A0", fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      orientation="right"
                      tickFormatter={(v) => {
                        const num = Number(v)
                        if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
                        if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`
                        return `₹${num}`
                      }} 
                      tick={{ fill: "#8B89A0", fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Bar dataKey="expense" radius={[6, 6, 0, 0]}>
                      {data.yearlyTrend.map((_, index) => {
                        const isCurrentYear = data.year === today.getFullYear()
                        const currentMonthIdx = today.getMonth() // 0-11
                        
                        let barColor = "rgba(0,0,0,0.06)" // edge-subtle
                        if (data.year < today.getFullYear()) {
                          barColor = "#DDD6FE" // brand-200 for all past months
                        } else if (isCurrentYear) {
                          if (index === currentMonthIdx) {
                            barColor = "#7C3AED" // brand-600 for current month
                          } else if (index < currentMonthIdx) {
                            barColor = "#DDD6FE" // brand-200 for past months
                          } else {
                            barColor = "rgba(0,0,0,0.06)" // edge-subtle for future months
                          }
                        } else {
                          barColor = "rgba(0,0,0,0.06)" // edge-subtle for all future months
                        }
                        
                        return <Cell key={`cell-${index}`} fill={barColor} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Daily spending heatmap */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <Calendar size={15} strokeWidth={1.5} className="text-[#4B4963]" aria-hidden="true" />
              <h2 className="text-[15px] font-medium text-[#0F0E17]">Daily Spending Heatmap</h2>
            </div>
            {loading || !data ? (
              <div className="h-40 w-full rounded-2xl bg-[#F8F7FF] animate-pulse" />
            ) : data.dailySpending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daily data for this month.</p>
            ) : (
              <div>
                <div className="relative w-fit">
                  <div className="grid grid-cols-7 gap-2 text-[11px] font-bold tracking-wider uppercase text-[#8B89A0] mb-3 text-center">
                    {["S","M","T","W","T","F","S"].map((d, i) => (
                      <div key={i} className="w-[32px] h-[32px] flex items-center justify-center">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2 relative">
                    {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-[32px] h-[32px]" />
                    ))}
                    {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, idx) => {
                      const day = idx + 1
                      const entry = data.dailySpending.find((e) => e.day === day)
                      return (
                        <motion.div
                          key={day}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.005 }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const parentRect = e.currentTarget.parentElement?.getBoundingClientRect()
                            setHoveredCell({
                              day,
                              amount: entry?.amount ?? 0,
                              x: rect.left - (parentRect?.left ?? 0) + rect.width / 2,
                              y: rect.top - (parentRect?.top ?? 0) - 8,
                            })
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] text-[10px] font-bold cursor-default transition-all duration-200 hover:scale-115 hover:shadow-md"
                          style={{ background: getHeatmapColor(entry?.amount ?? 0, heatmapMax) }}
                        >
                          <span className="opacity-75 text-[#0F0E17]">{day}</span>
                        </motion.div>
                      )
                    })}

                    {/* Heatmap Tooltip */}
                    {hoveredCell && (
                      <div
                        className="absolute z-10 px-3 py-2 bg-white text-[11px] font-bold rounded-xl shadow-elevated border border-[rgba(0,0,0,0.08)] -translate-x-1/2 -translate-y-full pointer-events-none whitespace-nowrap"
                        style={{ left: hoveredCell.x, top: hoveredCell.y }}
                      >
                        <span className="text-[#7C3AED]">
                          {new Date(year, month - 1, hoveredCell.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="mx-1.5 text-[#DDD6FE]">·</span>
                        <span className="tabular-nums text-[#0F0E17]">
                          {formatCurrency(hoveredCell.amount, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-4 text-[10px] font-bold uppercase tracking-wider text-[#B8B5C9]">
                  <span>Less</span>
                  <div className="w-5 h-5 rounded-[6px] bg-[#F5F3FF] border border-[#EDE9FE]" />
                  <div className="w-5 h-5 rounded-[6px] bg-[#EDE9FE]" />
                  <div className="w-5 h-5 rounded-[6px] bg-[#DDD6FE]" />
                  <div className="w-5 h-5 rounded-[6px] bg-[#C4B5FD]" />
                  <div className="w-5 h-5 rounded-[6px] bg-[#A78BFA]" />
                  <div className="w-5 h-5 rounded-[6px] bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]" />
                  <span>More</span>
                </div>
              </div>
            )}
          </motion.div>
      </div>
    </ErrorBoundary>
  )
}
