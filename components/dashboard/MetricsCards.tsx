"use client"

import { useEffect, useRef } from "react"
import { useProfile } from "@/hooks/useProfile"
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

// Count-up hook
function useCountUp(target: number, duration = 800, enabled = true) {
  const valueRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!enabled || !valueRef.current) return
    const start = performance.now()
    const startVal = 0

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const current = Math.round(startVal + (target - startVal) * ease)
      if (valueRef.current) {
        valueRef.current.textContent = current.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })
      }
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, enabled])

  return valueRef
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
}
const cardVariants = {
  initial:  { opacity: 0, y: 12, scale: 0.99 },
  animate:  { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

function StatCard({
  title,
  value,
  description,
  Icon,
  accentColor,
  trend,
  loading,
}: {
  title: string
  value: number
  description: string
  Icon: React.ElementType
  accentColor: string
  trend?: { label: string; up: boolean } | null
  loading: boolean
}) {
  const countRef = useCountUp(value, 800, !loading && value > 0)

  return (
    <motion.div variants={cardVariants} className="group">
      <div
        className="stat-card h-full flex flex-col gap-3"
        style={{ borderLeft: `3px solid ${accentColor}` }}
      >
        {/* Row 1: label + trend */}
        <div className="flex items-center gap-2">
          <Icon size={16} strokeWidth={1.5} className="text-[#8B89A0] flex-shrink-0" aria-hidden="true" />
          <span className="label-xs text-[#8B89A0] flex-1">{title}</span>
          {trend && (
            <span
              className={`fp-chip text-[10px] ${trend.up ? "fp-chip-gain" : "fp-chip-loss"}`}
            >
              {trend.up
                ? <ArrowUpRight size={10} aria-hidden="true" />
                : <ArrowDownRight size={10} aria-hidden="true" />}
              {trend.label}
            </span>
          )}
        </div>

        {/* Row 2: amount */}
        {loading ? (
          <div className="h-8 w-32 rounded-[6px] bg-[#F5F3FF] animate-pulse" />
        ) : (
          <div className="metric-value text-[#0F0E17]">
            <span ref={countRef} className="tabular-nums">
              {value.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        )}

        {/* Row 3: subtitle */}
        <p className="text-[12px] text-[#8B89A0] leading-tight">{description}</p>
      </div>
    </motion.div>
  )
}

export function MetricsCards({ data, loading, error }: MetricsCardsProps) {
  const { profile } = useProfile()

  const savingsRate = data?.savingsRate ?? null
  const balancePositive = (data?.currentBalance ?? 0) >= 0

  if (error) {
    return (
      <div className="fp-card p-5 text-[#DC2626] text-sm">
        <p className="font-medium">Unable to load metrics</p>
        <p className="text-xs mt-1 opacity-75">{error}</p>
      </div>
    )
  }

  const cards = [
    {
      title: "Monthly Income",
      value: data?.monthlyIncome ?? 0,
      description: "Total received this month",
      Icon: TrendingUp,
      accentColor: "#059669",
      trend: null,
    },
    {
      title: "Monthly Expenses",
      value: data?.monthlyExpenses ?? 0,
      description: "Total spent this month",
      Icon: TrendingDown,
      accentColor: "#DC2626",
      trend: null,
    },
    {
      title: "Net Balance",
      value: data?.currentBalance ?? 0,
      description: "Income minus expenses",
      Icon: Wallet,
      accentColor: "#7C3AED",
      trend: data
        ? { label: balancePositive ? "Positive" : "Negative", up: balancePositive }
        : null,
    },
    {
      title: "Savings Rate",
      value: 0, // handled separately
      description: "Share of income saved",
      Icon: PiggyBank,
      accentColor: "#D97706",
      trend: data && savingsRate !== null
        ? { label: savingsRate >= 20 ? "Healthy" : "Improve", up: savingsRate >= 20 }
        : null,
    },
  ]

  return (
    <motion.div
      className="grid gap-4 grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {cards.map((card, i) => {
        if (i === 3) {
          // Savings rate card — rendered separately as % not currency
          return (
            <motion.div key="savings-rate" variants={cardVariants} className="group">
              <div
                className="stat-card h-full flex flex-col gap-3"
                style={{ borderLeft: "3px solid #D97706" }}
              >
                <div className="flex items-center gap-2">
                  <PiggyBank size={16} strokeWidth={1.5} className="text-[#8B89A0] flex-shrink-0" aria-hidden="true" />
                  <span className="label-xs text-[#8B89A0] flex-1">Savings Rate</span>
                  {card.trend && (
                    <span className={`fp-chip text-[10px] ${card.trend.up ? "fp-chip-gain" : "fp-chip-loss"}`}>
                      {card.trend.up
                        ? <ArrowUpRight size={10} aria-hidden="true" />
                        : <ArrowDownRight size={10} aria-hidden="true" />}
                      {card.trend.label}
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="h-8 w-20 rounded-[6px] bg-[#F5F3FF] animate-pulse" />
                ) : (
                  <div className="metric-value text-[#0F0E17] tabular-nums">
                    {data && savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "N/A"}
                  </div>
                )}
                <p className="text-[12px] text-[#8B89A0] leading-tight">Share of income saved</p>
              </div>
            </motion.div>
          )
        }

        return (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            Icon={card.Icon}
            accentColor={card.accentColor}
            trend={card.trend}
            loading={loading}
          />
        )
      })}
    </motion.div>
  )
}
