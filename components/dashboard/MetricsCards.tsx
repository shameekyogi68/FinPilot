"use client"

import { useEffect, useRef } from "react"
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
  accent,
  iconBg,
  iconColor,
  trend,
  loading,
}: {
  title: string
  value: number
  description: string
  Icon: React.ElementType
  accent: "emerald" | "rose" | "brand" | "amber"
  iconBg: string
  iconColor: string
  trend?: { label: string; up: boolean } | null
  loading: boolean
}) {
  const countRef = useCountUp(value, 800, !loading && value > 0)

  return (
    <motion.div variants={cardVariants} className="group">
      <div className="stat-card h-full flex flex-col justify-between" data-accent={accent}>
        <div>
          {/* Row 1: Icon container, Title & Trend badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-[10px] ${iconBg} flex items-center justify-center`}>
                <Icon size={16} strokeWidth={2.5} className={iconColor} aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase">{title}</span>
            </div>
            {trend && (
              <span
                className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  trend.up ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                }`}
              >
                {trend.up ? <ArrowUpRight size={10} aria-hidden="true" /> : <ArrowDownRight size={10} aria-hidden="true" />}
                {trend.label}
              </span>
            )}
          </div>

          {/* Row 2: Metric Value */}
          {loading ? (
            <div className="h-8 w-32 rounded-[6px] bg-[#F5F3FF] animate-pulse my-1.5" />
          ) : (
            <div className="text-[26px] font-bold tracking-tight text-[#0F0E17] tabular-nums leading-none">
              <span ref={countRef}>
                {value.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Description */}
        <p className="text-[12px] text-[#8B89A0] mt-2 font-medium leading-tight">{description}</p>
      </div>
    </motion.div>
  )
}

export function MetricsCards({ data, loading, error }: MetricsCardsProps) {
  const savingsRate = data?.savingsRate ?? null
  const balancePositive = (data?.currentBalance ?? 0) >= 0

  if (error) {
    return (
      <div className="fp-card p-5 text-[#ef4444] text-sm">
        <p className="font-medium">Unable to load metrics</p>
        <p className="text-xs mt-1 opacity-75">{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Monthly Income Card */}
      <StatCard
        title="Income"
        value={data?.monthlyIncome ?? 0}
        description="Total received this month"
        Icon={TrendingUp}
        accent="emerald"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        trend={null}
        loading={loading}
      />

      {/* Monthly Expenses Card */}
      <StatCard
        title="Expenses"
        value={data?.monthlyExpenses ?? 0}
        description="Total spent this month"
        Icon={TrendingDown}
        accent="rose"
        iconBg="bg-red-50"
        iconColor="text-red-500"
        trend={null}
        loading={loading}
      />

      {/* Net Balance Card */}
      <StatCard
        title="Balance"
        value={data?.currentBalance ?? 0}
        description="Income minus expenses"
        Icon={Wallet}
        accent="brand"
        iconBg="bg-purple-50"
        iconColor="text-brand-600"
        trend={data ? { label: balancePositive ? "Positive" : "Negative", up: balancePositive } : null}
        loading={loading}
      />

      {/* Savings Rate Card */}
      <motion.div key="savings-rate" variants={cardVariants} className="group">
        <div className="stat-card h-full flex flex-col justify-between" data-accent="amber">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center">
                  <PiggyBank size={16} strokeWidth={2.5} className="text-amber-600" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase">Savings</span>
              </div>
              {data && savingsRate !== null && (
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    savingsRate >= 20 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                  }`}
                >
                  {savingsRate >= 20 ? <ArrowUpRight size={10} aria-hidden="true" /> : <ArrowDownRight size={10} aria-hidden="true" />}
                  {savingsRate >= 20 ? "Healthy" : "Improve"}
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-8 w-20 rounded-[6px] bg-[#F5F3FF] animate-pulse my-1.5" />
            ) : (
              <div className="text-[26px] font-bold tracking-tight text-[#0F0E17] tabular-nums leading-none">
                {data && savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "0.0%"}
              </div>
            )}
          </div>
          <p className="text-[12px] text-[#8B89A0] mt-2 font-medium leading-tight">Share of income saved</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
