"use client"

import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react"

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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
}

type CardConfig = {
  title: string
  value: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  trend?: { value: string; up: boolean } | null
}

export function MetricsCards({ data, loading, error }: MetricsCardsProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  const savingsRate = data?.savingsRate ?? null
  const balancePositive = (data?.currentBalance ?? 0) >= 0

  const cards: CardConfig[] = [
    {
      title: "Income",
      value: data ? formatCurrency(data.monthlyIncome, currency) : "—",
      description: "Total income this month",
      icon: TrendingUp,
      iconColor: "text-[hsl(var(--income))]",
      iconBg: "bg-[var(--income-bg)]",
      trend: null,
    },
    {
      title: "Expenses",
      value: data ? formatCurrency(data.monthlyExpenses, currency) : "—",
      description: "Total spent this month",
      icon: TrendingDown,
      iconColor: "text-[hsl(var(--expense))]",
      iconBg: "bg-[var(--expense-bg)]",
      trend: null,
    },
    {
      title: "Balance",
      value: data ? formatCurrency(data.currentBalance, currency) : "—",
      description: "Income minus expenses",
      icon: Wallet,
      iconColor: "text-[hsl(var(--primary))]",
      iconBg: "bg-[hsl(var(--muted))]",
      trend: data
        ? { value: balancePositive ? "Positive" : "Negative", up: balancePositive }
        : null,
    },
    {
      title: "Savings Rate",
      value: data && savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "N/A",
      description: "Share of income saved",
      icon: PiggyBank,
      iconColor: "text-[hsl(var(--primary))]",
      iconBg: "bg-[hsl(var(--muted))]",
      trend: data && savingsRate !== null
        ? { value: savingsRate >= 20 ? "Healthy" : "Improve", up: savingsRate >= 20 }
        : null,
    },
  ]

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 text-[hsl(var(--destructive))] text-sm">
        <p className="font-semibold">Unable to load metrics</p>
        <p className="text-xs mt-1 opacity-75">{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <motion.div key={card.title} variants={itemVariants}>
            <div className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-5 h-full flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                {card.trend && (
                  <span
                    className={`flex items-center gap-0.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      card.trend.up
                        ? "bg-[var(--income-bg)] text-[hsl(var(--income))] border border-[var(--income-border)]"
                        : "bg-[var(--expense-bg)] text-[hsl(var(--expense))] border border-[var(--expense-border)]"
                    }`}
                  >
                    {card.trend.up ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {card.trend.value}
                  </span>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                  {card.title}
                </p>
                <div className="font-sora text-2xl font-semibold text-foreground">
                  {loading ? (
                    <div className="h-8 w-24 rounded-lg bg-[hsl(var(--muted))] animate-pulse" />
                  ) : (
                    card.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
