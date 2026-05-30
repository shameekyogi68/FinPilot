"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ExpenseChart } from "@/components/dashboard/ExpenseChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "@/components/ui/sonner"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { ThemeToggle } from "@/components/ThemeToggle"
import { AnalyticsSkeleton } from "@/components/skeletons/AnalyticsSkeleton"

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]


const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

type MonthlySummary = {
  month: number
  year: number
  monthLabel: string
  income: number
  expense: number
  net: number
  savingsRate: number
}

type TrendEntry = {
  month: string
  year: number
  income: number
  expense: number
  net: number
  savingsRate: number
}

type YearlyTrendEntry = {
  month: string
  year: number
  expense: number
}

type CategoryBreakdown = {
  category: string
  amount: number
}[]

type DailySpendingEntry = {
  day: number
  amount: number
}[]

type AnalyticsResponse = {
  month: number
  year: number
  monthlySummary: MonthlySummary
  last6MonthsTrend: TrendEntry[]
  yearlyTrend: YearlyTrendEntry[]
  categoryBreakdown: CategoryBreakdown
  dailySpending: DailySpendingEntry
}

export default function AnalyticsPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useProfile()
  const currency = profile?.currency ?? "USD"

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, index) => current - index)
  }, [])

  const fetchAnalytics = async (selectedMonth: number, selectedYear: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics?month=${selectedMonth}&year=${selectedYear}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load analytics data")
      }

      setData(payload as AnalyticsResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics data")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(month, year)
  }, [month, year])

  const heatmapMax = useMemo(() => {
    return data?.dailySpending.reduce((max, day) => Math.max(max, day.amount), 0) ?? 1
  }, [data])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 py-10 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Analytics</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Spending trends and insights</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                  Explore your income, expenses, category breakdowns, and spending trends by month and year.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Month
                  <select
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                  >
                    {monthNames.map((name, index) => (
                      <option key={name} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Year
                  <select
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                  >
                    {yearOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => fetchAnalytics(month, year)} disabled={loading}>
                  Refresh
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>

        {loading ? (
          <AnalyticsSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-destructive">
            <p className="font-semibold">Unable to load analytics</p>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly summary</CardTitle>
              <CardDescription>{data?.monthlySummary.monthLabel ?? "Loading month data..."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Income",
                    value: data ? formatCurrency(data.monthlySummary.income, currency) : "-",
                    description: "Total incoming funds this month",
                  },
                  {
                    title: "Expenses",
                    value: data ? formatCurrency(data.monthlySummary.expense, currency) : "-",
                    description: "Total spending this month",
                  },
                  {
                    title: "Net",
                    value: data ? formatCurrency(data.monthlySummary.net, currency) : "-",
                    description: "Income minus expenses",
                  },
                  {
                    title: "Savings rate",
                    value: data ? `${data.monthlySummary.savingsRate.toFixed(1)}%` : "-",
                    description: "Portion of income saved this month",
                  },
                ].map((metric) => (
                  <div key={metric.title} className="rounded-3xl border border-border bg-muted p-5">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{metric.title}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{metric.value}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ErrorBoundary fallback={<div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Unable to render category chart.</div>}>
            <ExpenseChart
              data={data?.categoryBreakdown ?? null}
              loading={loading}
              error={error}
            />
          </ErrorBoundary>
        </div>

        <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-[58%_42%]">
          <Card className="min-h-[28rem]">
            <CardHeader>
              <CardTitle>6 month spending trend</CardTitle>
              <CardDescription>
                Compare income and expenses across the last six months.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[28rem]">
              {loading || !data ? (
                <div className="h-full animate-pulse rounded-3xl bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.last6MonthsTrend} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(Number(value), currency)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[28rem]">
            <CardHeader>
              <CardTitle>Yearly expense trend</CardTitle>
              <CardDescription>Monthly expenses for {year}.</CardDescription>
            </CardHeader>
            <CardContent className="h-[28rem]">
              {loading || !data ? (
                <div className="h-full animate-pulse rounded-3xl bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.yearlyTrend} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(Number(value), currency)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                    <Bar dataKey="expense" fill="#f97316" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-[45%_55%]">
          <Card>
            <CardHeader>
              <CardTitle>Top spending categories</CardTitle>
              <CardDescription>Where your money is going this month.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !data ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-3xl bg-muted" />
                  ))}
                </div>
              ) : data.categoryBreakdown.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
                  No category spending this month.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.categoryBreakdown.slice(0, 6).map((category) => (
                    <div key={category.category} className="flex items-center justify-between rounded-3xl border border-border bg-card p-4">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{category.category}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {((category.amount / (data?.categoryBreakdown.reduce((sum, item) => sum + item.amount, 0) || 1)) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(category.amount, currency)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily spending heatmap</CardTitle>
              <CardDescription>Track day-by-day expense intensity.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !data ? (
                <div className="h-80 animate-pulse rounded-3xl bg-muted" />
              ) : data.dailySpending.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
                  No daily spending data for this month.
                </div>
              ) : (
                <div className="grid gap-2">
                  <div className="grid grid-cols-7 gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="text-center">
                        {"SMTWTFS"[index]}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, index) => {
                      const day = index + 1
                      const dayEntry = data.dailySpending.find((entry) => entry.day === day)
                      const intensity = dayEntry ? Math.max(0.1, Math.min(0.95, dayEntry.amount / heatmapMax)) : 0.05
                      const backgroundColor = dayEntry
                        ? `rgba(59, 130, 246, ${intensity})`
                        : "rgba(148, 163, 184, 0.08)"

                      return (
                        <div
                          key={day}
                          className="rounded-2xl border border-border px-2 py-2 text-center text-xs text-slate-800 dark:text-slate-100"
                          style={{ backgroundColor }}
                          title={`${dayEntry ? formatCurrency(dayEntry.amount, currency) : "No spending"}`}
                        >
                          <span className="block text-[0.72rem] font-medium">{day}</span>
                          <span className="block text-[0.65rem] text-slate-600 dark:text-slate-300">
                            {dayEntry ? formatCurrency(dayEntry.amount, currency) : "-"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
