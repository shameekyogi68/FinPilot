"use client"

import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type DashboardMetrics = {
  currentBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number | null
}

type MetricsCardsProps = {
  data: DashboardMetrics | null
  loading: boolean
  error: string | null
}

export function MetricsCards({ data, loading, error }: MetricsCardsProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "USD"

  const cards = [
    {
      title: "Current balance",
      value: data ? formatCurrency(data.currentBalance, currency) : "-",
      description: "Net income minus expenses",
    },
    {
      title: "This month’s income",
      value: data ? formatCurrency(data.monthlyIncome, currency) : "-",
      description: "Total income for the current month",
    },
    {
      title: "This month’s expenses",
      value: data ? formatCurrency(data.monthlyExpenses, currency) : "-",
      description: "Total expenses for the current month",
    },
    {
      title: "Savings rate",
      value:
        data && data.savingsRate !== null
          ? `${data.savingsRate.toFixed(1)}%`
          : "N/A",
      description: "Share of income saved this month",
    },
  ]

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <p className="font-medium">Unable to load metrics</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[3rem] text-3xl font-semibold">
              {loading ? (
                <div className="h-12 w-32 animate-pulse rounded-lg bg-muted" />
              ) : (
                card.value
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
