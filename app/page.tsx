"use client"

import { useEffect, useMemo, useState } from "react"
import { MetricsCards, type DashboardMetrics } from "@/components/dashboard/MetricsCards"
import { AIInsightCard } from "@/components/dashboard/AIInsightCard"
import { ExpenseChart, type ExpenseCategorySlice } from "@/components/dashboard/ExpenseChart"
import { RecentTransactionsWidget, type RecentTransaction } from "@/components/dashboard/RecentTransactionsWidget"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "@/components/ui/sonner"
import { ThemeToggle } from "@/components/ThemeToggle"

type DashboardState = {
  metrics: DashboardMetrics | null
  expenseData: ExpenseCategorySlice[] | null
  recentTransactions: RecentTransaction[] | null
}

export default function Home() {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    expenseData: null,
    recentTransactions: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const metricsPromise = fetch("/api/dashboard/metrics").then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load metrics")
      return res.json()
    })

    const expensePromise = fetch("/api/dashboard/expenses").then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load expenses")
      return res.json()
    })

    const recentPromise = fetch("/api/transactions?limit=5").then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load transactions")
      return res.json()
    })

    Promise.all([metricsPromise, expensePromise, recentPromise])
      .then(([metrics, expenseData, recentTransactions]) => {
        setState({ metrics, expenseData, recentTransactions })
      })
      .catch((err) => {
        console.error(err)
        setError(err?.message ?? "Unable to load dashboard")
      })
      .finally(() => setLoading(false))
  }, [])

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 py-10 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Your financial overview</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Monitor your balance, income, expenses, and recent activity in one place.
              </p>
            </div>
              <ThemeToggle />
            </div>
        </header>

        <ErrorBoundary fallback={<div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Unable to render dashboard.</div>}>
          <MetricsCards data={state.metrics} loading={loading} error={error} />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Unable to render AI insights.</div>}>
          <AIInsightCard month={currentMonth} />
        </ErrorBoundary>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[40%_60%]">
          <ErrorBoundary fallback={<div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Unable to render chart.</div>}>
            <ExpenseChart data={state.expenseData} loading={loading} error={error} />
          </ErrorBoundary>
          <ErrorBoundary fallback={<div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Unable to render recent transactions.</div>}>
            <RecentTransactionsWidget
              transactions={state.recentTransactions}
              loading={loading}
              error={error}
            />
          </ErrorBoundary>
        </div>
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
