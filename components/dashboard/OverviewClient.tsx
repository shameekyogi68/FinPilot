"use client"

import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Sparkles,
  Calendar,
  Compass,
  CalendarClock,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import Link from "next/link"
import { inr, inrShort } from "@/lib/utils/format"
import type {
  DashboardMetrics,
  ExpenseCategorySlice,
  RecentTransaction,
  DayCashFlow,
} from "@/lib/queries/dashboardQueries"
import type { RunwayMetrics } from "@/lib/queries/runwayQueries"
import { AiMarkdown } from "@/components/ui/ai-markdown"
import { useState } from "react"
import { DailyWealthPulseBanner } from "@/components/wealth/DailyWealthPulseBanner"
import { MonthlyWealthWizard } from "@/components/wealth/MonthlyWealthWizard"
import { MutualFundIntelligence } from "@/components/wealth/MutualFundIntelligence"
import { FloatingAIWealthOfficer } from "@/components/wealth/FloatingAIWealthOfficer"
import { Sliders } from "lucide-react"

type Props = {
  metrics: DashboardMetrics
  expenseData: ExpenseCategorySlice[]
  recentTransactions: RecentTransaction[]
  weeklyCashFlow: DayCashFlow[]
  runway: RunwayMetrics
  netWorth: number
  investedValue: number
  profileName: string
  insights: string[]
  monthlyReview: string[] | null
  monthlyReviewLabel: string
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
}

const VOLATILITY_LABEL: Record<RunwayMetrics["incomeVolatility"], string> = {
  steady: "Steady income",
  variable: "Variable income",
  highly_variable: "Highly variable income",
  unknown: "Still gathering data",
}

export function OverviewClient({
  metrics,
  expenseData,
  recentTransactions,
  weeklyCashFlow,
  runway,
  netWorth,
  investedValue,
  profileName,
  insights,
  monthlyReview,
  monthlyReviewLabel,
}: Props) {
  const [wizardOpen, setWizardOpen] = useState(false)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  })()

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const netThisMonth = metrics.monthlyIncome - metrics.monthlyExpense
  const runwaySub =
    runway.runwayMonths === null
      ? "Add expenses to see your runway"
      : `${VOLATILITY_LABEL[runway.incomeVolatility]} · avg burn ${inrShort(runway.avgMonthlyExpense)}/mo`

  return (
    <div className="space-y-8">
      {/* ── Monthly Wealth Plan Modal ── */}
      <MonthlyWealthWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* ── Page header ── */}
      <motion.div
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={fadeUp.transition}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="text-[12.5px] text-[#8C8AA0] mb-1.5 flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={1.75} />
            {dateLabel}
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#14131F] leading-[1.1]">
            {greeting}, <span className="font-display italic text-gradient">{profileName}.</span>
          </h1>
          <p className="text-[14px] text-[#565469] mt-2">
            {netThisMonth >= 0 ? (
              <>You&apos;ve netted <span className="font-medium text-[#14131F]">{inr(netThisMonth)}</span> so far this month.</>
            ) : (
              <>You&apos;re <span className="font-medium text-[#14131F]">{inr(Math.abs(netThisMonth))}</span> in the red this month.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWizardOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-[13px] flex items-center gap-2 hover:opacity-95 shadow-md shadow-emerald-500/20"
          >
            <Sliders size={15} strokeWidth={2} />
            Monthly Wealth Execution Wizard
          </button>
          <Link href="/transactions" className="btn-primary">
            <Plus size={14} strokeWidth={2} />
            New transaction
          </Link>
        </div>
      </motion.div>

      {/* ── Autonomous Daily Wealth Manager Banner ── */}
      <DailyWealthPulseBanner />

      {/* ── Hero balance card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#14131F] via-[#1F1D2E] to-[#2A2740] p-7 sm:p-9 text-white"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#6D55E3] opacity-25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-[#A48FF6] opacity-15 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[12.5px] uppercase tracking-[0.14em] text-white/55 font-semibold">Net balance</p>
            <span className={`pill ${metrics.monthOverMonthChange >= 0 ? "pill-gain" : "pill-loss"}`}>
              {metrics.monthOverMonthChange >= 0 ? (
                <TrendingUp size={11} strokeWidth={2} />
              ) : (
                <TrendingDown size={11} strokeWidth={2} />
              )}
              {metrics.monthOverMonthChange >= 0 ? "+" : ""}
              {(metrics.monthOverMonthChange * 100).toFixed(1)}% net vs last month
            </span>
          </div>
          <h2 className="font-variant-tabular text-[42px] sm:text-[52px] font-semibold leading-none tracking-tight text-white">
            {inr(metrics.currentBalance)}
          </h2>
          <p className="text-white/55 text-[13px] mt-2 flex items-center gap-1.5">
            <Compass size={13} strokeWidth={1.75} />
            {runway.runwayMonths !== null
              ? `${runway.runwayMonths.toFixed(1)} months of runway at your current burn rate`
              : "Runway will show once you log expenses"}
          </p>

          {/* Weekly cash flow chart */}
          <div className="mt-7 -mx-2 h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyCashFlow} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="cf-in" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A48FF6" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#A48FF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cf-out" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.20} />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="inflow" stroke="#A48FF6" strokeWidth={2} fill="url(#cf-in)" />
                <Area type="monotone" dataKey="outflow" stroke="#FFFFFF" strokeWidth={1.5} strokeOpacity={0.4} fill="url(#cf-out)" />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  contentStyle={{
                    background: "rgba(20,19,31,0.95)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  formatter={(value) => inrShort(Number(value))}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-2 text-[12px] text-white/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A48FF6]" />
              Inflow this week
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/40" />
              Outflow this week
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat tiles ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        <Link href="/investments" className="stat-tile block hover:border-[rgba(109,85,227,0.3)] transition-colors">
          <p className="section-title mb-2">Net worth</p>
          <p className="text-[20px] sm:text-[22px] font-semibold text-[#14131F] tracking-tight tabular-nums leading-tight">
            {inr(netWorth)}
          </p>
          <p className="mt-2 text-[11.5px] font-medium text-[#8C8AA0]">
            {investedValue > 0 ? `incl. ${inrShort(investedValue)} invested` : "cash + investments"}
          </p>
        </Link>
        <StatCard
          label="Income (MTD)"
          value={inr(metrics.monthlyIncome)}
          change={metrics.incomeChange}
          accent="var(--bar, linear-gradient(90deg, #2DC295, #0E8A5F))"
        />
        <StatCard
          label="Expenses (MTD)"
          value={inr(metrics.monthlyExpense)}
          change={-metrics.expenseChange}
          accent="var(--bar, linear-gradient(90deg, #ED6F6F, #D63B3B))"
        />
        <div className="stat-tile" style={{ "--bar": "var(--bar, linear-gradient(90deg, #A48FF6, #6D55E3))" } as React.CSSProperties}>
          <p className="section-title mb-2">Savings rate</p>
          <p className="text-[20px] sm:text-[22px] font-semibold text-[#14131F] tracking-tight tabular-nums leading-tight">
            {(metrics.savingsRate * 100).toFixed(1)}%
          </p>
          <p className="mt-2 text-[11.5px] font-medium text-[#8C8AA0]">of income kept, this month</p>
        </div>
        <div className="stat-tile" style={{ "--bar": "var(--bar, linear-gradient(90deg, #F2B168, #C77A1F))" } as React.CSSProperties}>
          <p className="section-title mb-2">Budget used</p>
          <p className="text-[20px] sm:text-[22px] font-semibold text-[#14131F] tracking-tight tabular-nums leading-tight">
            {(metrics.budgetUtilization * 100).toFixed(0)}%
          </p>
          <p className="mt-2 text-[11.5px] font-medium text-[#8C8AA0]">of budgeted limits spent</p>
        </div>
        <div className="stat-tile col-span-2 lg:col-span-1">
          <p className="section-title mb-2">Runway</p>
          <p className="text-[20px] sm:text-[22px] font-semibold text-[#14131F] tracking-tight tabular-nums leading-tight">
            {runway.runwayMonths !== null ? `${runway.runwayMonths.toFixed(1)} mo` : "—"}
          </p>
          <p className="mt-2 text-[11.5px] font-medium text-[#8C8AA0] leading-snug">{runwaySub}</p>
        </div>
      </motion.div>

      {/* ── Two-column: expense breakdown + recent transactions ── */}
      <div className="grid lg:grid-cols-5 gap-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lg:col-span-2 surface-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-[#14131F]">Where it went</h3>
              <p className="text-[12.5px] text-[#8C8AA0] mt-0.5">Spending by category this month</p>
            </div>
          </div>

          {expenseData.length === 0 ? (
            <p className="text-[13px] text-[#8C8AA0] py-6 text-center">No expenses logged yet this month.</p>
          ) : (
            <div className="space-y-3.5">
              {(() => {
                const total = expenseData.reduce((s, c) => s + c.value, 0)
                return expenseData.map((c) => {
                  const pct = total > 0 ? (c.value / total) * 100 : 0
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-[13px] mb-1.5">
                        <span className="text-[#14131F] font-medium capitalize">{c.name}</span>
                        <span className="text-[#565469] tabular-nums">{inr(c.value)}</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lg:col-span-3 surface-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-[#14131F]">Recent activity</h3>
              <p className="text-[12.5px] text-[#8C8AA0] mt-0.5">Latest {recentTransactions.length} transactions</p>
            </div>
            <Link href="/transactions" className="text-[12.5px] text-[#4A30A8] hover:text-[#14131F] font-medium inline-flex items-center gap-1">
              See all
              <ArrowUpRight size={12} strokeWidth={1.75} />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-[13px] text-[#8C8AA0] py-6 text-center">No transactions yet. Add your first one.</p>
          ) : (
            <ul className="divide-y divide-[rgba(20,19,31,0.06)]">
              {recentTransactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F1FB] flex items-center justify-center text-[13px] font-semibold text-[#4A30A8] flex-shrink-0">
                    {t.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-[#14131F] truncate capitalize">{t.description}</p>
                    <p className="text-[12px] text-[#8C8AA0] capitalize">
                      {t.category} · {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className={`text-[13.5px] font-medium tabular-nums ${t.type === "INCOME" ? "text-[#0E8A5F]" : "text-[#14131F]"}`}>
                    {t.type === "INCOME" ? "+" : "−"}{inrShort(Math.abs(t.amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* ── Monthly review ── */}
      {monthlyReview && monthlyReview.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="surface-card p-6"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-7 h-7 rounded-lg bg-[#14131F] flex items-center justify-center flex-shrink-0">
              <CalendarClock size={14} strokeWidth={1.75} className="text-white" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-[#14131F]">
                Monthly review — {new Date(`${monthlyReviewLabel}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </h3>
              <p className="text-[12px] text-[#8C8AA0]">Generated automatically, no prompting needed</p>
            </div>
          </div>
          <ul className="space-y-2">
            {monthlyReview.map((line, idx) => (
              <li key={idx} className="text-[13px] text-[#565469] leading-relaxed flex gap-2">
                <span className="text-[#A48FF6] flex-shrink-0">•</span>
                <AiMarkdown content={line} block={false} />
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* ── Live Mutual Fund Market Intelligence ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <MutualFundIntelligence />
      </motion.section>

      {/* ── AI Insights ── */}
      {insights.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A48FF6] to-[#6D55E3] flex items-center justify-center">
                <Sparkles size={14} strokeWidth={2} className="text-white" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#14131F]">Runway reads</h3>
                <p className="text-[12px] text-[#8C8AA0]">Signals from this month&apos;s real data</p>
              </div>
            </div>
            <Link href="/ai-advisor" className="text-[12.5px] text-[#4A30A8] hover:text-[#14131F] font-medium inline-flex items-center gap-1">
              Ask the advisor
              <ArrowUpRight size={12} strokeWidth={1.75} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="insight insight-tip">
                <AiMarkdown content={insight} block={false} className="text-[12.5px] text-[#565469] leading-relaxed" />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Floating Luxury AI Wealth Officer Copilot ── */}
      <FloatingAIWealthOfficer />
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  accent,
}: {
  label: string
  value: string
  change: number
  accent: string
}) {
  const positive = change >= 0
  return (
    <div className="stat-tile" style={{ "--bar": accent } as React.CSSProperties}>
      <p className="section-title mb-2">{label}</p>
      <p className="text-[20px] sm:text-[22px] font-semibold text-[#14131F] tracking-tight tabular-nums leading-tight">
        {value}
      </p>
      <p className={`mt-2 text-[11.5px] font-medium inline-flex items-center gap-1 ${positive ? "text-[#0E8A5F]" : "text-[#A02727]"}`}>
        {positive ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
        {positive ? "+" : ""}{(change * 100).toFixed(1)}% vs last month
      </p>
    </div>
  )
}
