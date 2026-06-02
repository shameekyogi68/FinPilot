"use client"

import { useEffect, useMemo, useState } from "react"
import { MetricsCards, type DashboardMetrics } from "@/components/dashboard/MetricsCards"
import { AIInsightCard } from "@/components/dashboard/AIInsightCard"
import { ExpenseChart, type ExpenseCategorySlice } from "@/components/dashboard/ExpenseChart"
import { RecentTransactionsWidget, type RecentTransaction } from "@/components/dashboard/RecentTransactionsWidget"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { motion } from "framer-motion"
import { RefreshCw, CalendarDays } from "lucide-react"

type DashboardState = {
  metrics: DashboardMetrics | null
  expenseData: ExpenseCategorySlice[] | null
  recentTransactions: RecentTransaction[] | null
}

const pageVariants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function Home() {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    expenseData: null,
    recentTransactions: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [metrics, expenseData, recentTransactions] = await Promise.all([
        fetch("/api/dashboard/metrics").then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).error || "Failed")
          return r.json()
        }),
        fetch("/api/dashboard/expenses").then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).error || "Failed")
          return r.json()
        }),
        fetch("/api/transactions?limit=5").then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).error || "Failed")
          return r.json()
        }),
      ])
      setState({ metrics, expenseData, recentTransactions })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
  }

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  }, [])

  const dateLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  }, [])

  const netWorth = state.metrics?.currentBalance ?? null

  return (
    <ErrorBoundary>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ── Top bar ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[#0F0E17] leading-tight">
              Good morning, <span className="text-gradient">Shameek</span>
            </h1>
            <p className="text-[14px] text-[#8B89A0] mt-1 font-variant-tabular">
              {dateLabel}
              {netWorth !== null && (
                <>
                  {" · "}
                  <span className="tabular-nums">
                    {netWorth.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                  </span>
                  {" net worth"}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              aria-label="Refresh dashboard data"
              className="w-9 h-9 rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-white/70 flex items-center justify-center text-[#8B89A0] hover:text-[#0F0E17] hover:border-[rgba(0,0,0,0.14)] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 backdrop-blur-md"
            >
              <RefreshCw
                size={16}
                strokeWidth={1.5}
                className={(loading || refreshing) ? "animate-spin" : ""}
                aria-hidden="true"
              />
            </button>

            {/* Date chip */}
            <div className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-white/70 text-[13px] text-[#4B4963] font-medium backdrop-blur-md">
              <CalendarDays size={14} strokeWidth={1.5} className="text-[#8B89A0]" aria-hidden="true" />
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* ── Metrics ── */}
        <ErrorBoundary
          fallback={
            <div className="rounded-[14px] border border-red-100 bg-red-50 p-5 text-red-600 text-sm">
              Unable to render dashboard metrics.
            </div>
          }
        >
          <MetricsCards data={state.metrics} loading={loading} error={error} />
        </ErrorBoundary>

        {/* ── AI Insights ── */}
        <ErrorBoundary
          fallback={
            <div className="rounded-[14px] border border-red-100 bg-red-50 p-5 text-red-600 text-sm">
              Unable to render AI insights.
            </div>
          }
        >
          <AIInsightCard month={currentMonth} />
        </ErrorBoundary>

        {/* ── Charts + Transactions ── */}
        <div className="grid gap-5 md:grid-cols-[40%_60%]">
          <ErrorBoundary
            fallback={
              <div className="rounded-[14px] border border-red-100 bg-red-50 p-5 text-red-600 text-sm">
                Unable to render chart.
              </div>
            }
          >
            <ExpenseChart data={state.expenseData} loading={loading} error={error} />
          </ErrorBoundary>
          <ErrorBoundary
            fallback={
              <div className="rounded-[14px] border border-red-100 bg-red-50 p-5 text-red-600 text-sm">
                Unable to render recent transactions.
              </div>
            }
          >
            <RecentTransactionsWidget
              transactions={state.recentTransactions}
              loading={loading}
              error={error}
            />
          </ErrorBoundary>
        </div>
      </motion.div>
    </ErrorBoundary>
  )
}
