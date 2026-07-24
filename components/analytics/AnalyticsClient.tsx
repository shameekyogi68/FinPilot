"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { inr } from "@/lib/utils/format"
import { categoryColor } from "@/lib/utils/categoryStyle"
import type { getCategoryBreakdown, getDailySpending, getLast6MonthsTrend, getMonthlySummary } from "@/lib/queries/analyticsQueries"

type MonthlySummary = Awaited<ReturnType<typeof getMonthlySummary>>
type MonthTrend = Awaited<ReturnType<typeof getLast6MonthsTrend>>
type CategoryBreakdown = Awaited<ReturnType<typeof getCategoryBreakdown>>
type DailySpending = Awaited<ReturnType<typeof getDailySpending>>

type Props = {
  monthlySummary: MonthlySummary
  last6MonthsTrend: MonthTrend
  categoryBreakdown: CategoryBreakdown
  dailySpending: DailySpending
  month: number
  year: number
}

function heatColor(amount: number, max: number): string {
  if (amount <= 0) return "#F4F2F8"
  const r = max > 0 ? amount / max : 0
  if (r <= 0.2) return "#EFEAFE"
  if (r <= 0.4) return "#DCD0FB"
  if (r <= 0.6) return "#B6A0F4"
  if (r <= 0.8) return "#8A6BF0"
  return "#5E3FCE"
}

export function AnalyticsClient({ monthlySummary, last6MonthsTrend, categoryBreakdown, dailySpending, month, year }: Props) {
  const [view, setView] = useState<"6mo" | "monthly" | "categories">("6mo")

  const sortedBreakdown = useMemo(
    () => [...categoryBreakdown].sort((a, b) => b.amount - a.amount),
    [categoryBreakdown]
  )
  const totalExpense = sortedBreakdown.reduce((s, c) => s + c.amount, 0)

  const daysLeft = useMemo(() => {
    const today = new Date()
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    return last - today.getDate()
  }, [])

  const dailyGrid = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstWeekday = new Date(year, month - 1, 1).getDay()
    const byDay = new Map(dailySpending.map((d) => [d.day, d.amount]))
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: byDay.get(i + 1) ?? 0 }))
    const max = days.reduce((m, d) => Math.max(m, d.amount), 0)
    return { firstWeekday, days, max }
  }, [dailySpending, month, year])

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#14131F] leading-[1.1]">
            <span className="font-display italic text-gradient">Analytics</span>
          </h1>
          <p className="text-[14px] text-[#565469] mt-2">
            Trends, breakdowns, and the shape of your spending.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[rgba(20,19,31,0.06)]">
          {[
            { v: "6mo", l: "6 months" },
            { v: "monthly", l: "This month" },
            { v: "categories", l: "Categories" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setView(opt.v as typeof view)}
              className={`h-8 px-3.5 text-[12.5px] font-medium rounded-lg transition-all ${
                view === opt.v ? "bg-[#14131F] text-white" : "text-[#565469] hover:text-[#14131F]"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Headline tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigTile label={`Net flow (${monthlySummary.monthLabel})`} value={inr(monthlySummary.net)} sub="income − expense" tone={monthlySummary.net >= 0 ? "gain" : "loss"} />
        <BigTile label="Savings rate" value={`${monthlySummary.savingsRate.toFixed(1)}%`} sub="share of income saved" tone="brand" />
        <BigTile label="Daily burn" value={inr(Math.round(monthlySummary.expense / Math.max(daysLeft, 1)))} sub={`${daysLeft} days remaining`} tone="warn" />
        <BigTile label="Top category" value={sortedBreakdown[0]?.category ?? "—"} sub={`${inr(sortedBreakdown[0]?.amount ?? 0)} this month`} tone="default" />
      </div>

      {/* 6mo view */}
      {view === "6mo" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-[#14131F]">Income vs Expenses</h3>
              <p className="text-[12.5px] text-[#8C8AA0] mt-0.5">Last 6 months · violet area = income, line = expenses</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last6MonthsTrend} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6D55E3" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="#6D55E3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(20,19,31,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#8C8AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: "#8C8AA0", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(109,85,227,0.18)" }}
                  contentStyle={{
                    background: "white",
                    border: "1px solid rgba(20,19,31,0.08)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#14131F",
                  }}
                  formatter={(v) => inr(Number(v))}
                />
                <Area type="monotone" dataKey="income" stroke="#6D55E3" strokeWidth={2.5} fill="url(#incomeGrad)" />
                <Line type="monotone" dataKey="expense" stroke="#A02727" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3 text-[12px] text-[#565469]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6D55E3]" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#A02727] bg-transparent" /> Expenses
            </span>
          </div>
        </motion.div>
      )}

      {/* Monthly bars + heatmap */}
      {view === "monthly" && (
        <div className="grid lg:grid-cols-5 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 surface-card p-6"
          >
            <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Net savings by month</h3>
            <p className="text-[12.5px] text-[#8C8AA0] mb-5">A clear picture of compounding wins.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6MonthsTrend} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(20,19,31,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8C8AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "#8C8AA0", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(109,85,227,0.06)" }}
                    contentStyle={{
                      background: "white",
                      border: "1px solid rgba(20,19,31,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => inr(Number(v))}
                  />
                  <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                    {last6MonthsTrend.map((entry, idx) => (
                      <Cell key={idx} fill={entry.net > 0 ? "#6D55E3" : "#E04B4B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="lg:col-span-3 surface-card p-6"
          >
            <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Daily spending heatmap</h3>
            <p className="text-[12.5px] text-[#8C8AA0] mb-5">{monthlySummary.monthLabel} · darker = more spent</p>
            <div className="grid grid-cols-7 gap-2 mb-3 text-[10px] font-semibold tracking-wider uppercase text-[#8C8AA0] text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="w-8 h-6 flex items-center justify-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: dailyGrid.firstWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8" />
              ))}
              {dailyGrid.days.map((d) => (
                <div
                  key={d.day}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-[#14131F] hover:scale-110 transition-transform"
                  style={{ background: heatColor(d.amount, dailyGrid.max) }}
                  title={`Day ${d.day}: ${inr(d.amount)}`}
                >
                  {d.day}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#8C8AA0]">
              <span>Less</span>
              {["#F4F2F8", "#EFEAFE", "#DCD0FB", "#B6A0F4", "#8A6BF0", "#5E3FCE"].map((c) => (
                <span key={c} className="w-5 h-5 rounded-md" style={{ background: c }} />
              ))}
              <span>More</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Categories view */}
      {view === "categories" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface-card p-6"
        >
          <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Spending by category</h3>
          <p className="text-[12.5px] text-[#8C8AA0] mb-6">Total {inr(totalExpense)} this month</p>
          {sortedBreakdown.length === 0 ? (
            <p className="text-[13px] text-[#8C8AA0] py-6 text-center">No expenses logged this month.</p>
          ) : (
            <div className="space-y-4">
              {sortedBreakdown.map((c) => {
                const pct = totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0
                const color = categoryColor(c.category)
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="text-[#14131F] font-medium capitalize">{c.category}</span>
                      <span className="text-[#565469] tabular-nums">{inr(c.amount)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="progress-track !h-2.5">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function BigTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: "gain" | "loss" | "brand" | "warn" | "default"
}) {
  const valueColor =
    tone === "gain" ? "text-[#0E8A5F]" :
    tone === "loss" ? "text-[#A02727]" :
    tone === "brand" ? "text-gradient" :
    tone === "warn" ? "text-[#C77A1F]" :
    "text-[#14131F]"

  return (
    <div className="stat-tile">
      <p className="section-title mb-2">{label}</p>
      <p className={`text-[22px] sm:text-[24px] font-semibold tabular-nums leading-tight ${valueColor}`}>{value}</p>
      <p className="text-[11.5px] text-[#8C8AA0] mt-2">{sub}</p>
    </div>
  )
}
