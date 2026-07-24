import { prisma } from "@/lib/prisma"
import { getCurrentBalance } from "@/lib/queries/dashboardQueries"

export type Holding = {
  id: string
  name: string
  type: string
  category: string
  investedAmount: number
  currentValue: number
  units: number | null
  symbol: string | null
  purchaseDate: string | null
  notes: string | null
}

export type AllocationSlice = {
  category: string
  value: number
  pct: number
  targetPct: number
  driftPct: number
  needsRebalance: boolean
}

const DEFAULT_REBALANCE_THRESHOLD_PCT = 5

export type PortfolioSummary = {
  holdings: Holding[]
  totalInvested: number
  totalCurrentValue: number
  totalGain: number
  totalGainPct: number
  allocation: AllocationSlice[]
  netWorth: number
  riskProfile: string
  rebalanceThresholdPct: number
}

const ALLOCATION_CATEGORIES = ["equity", "debt", "gold", "cash", "other"] as const

export async function getHoldings(): Promise<Holding[]> {
  const rows = await prisma.investment.findMany({ orderBy: { createdAt: "desc" } })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    category: r.category,
    investedAmount: r.investedAmount,
    currentValue: r.currentValue,
    units: r.units,
    symbol: r.symbol,
    purchaseDate: r.purchaseDate ? r.purchaseDate.toISOString() : null,
    notes: r.notes,
  }))
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [holdings, profile, cashBalance] = await Promise.all([
    getHoldings(),
    prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null),
    getCurrentBalance(),
  ])

  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0)
  const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalGain = totalCurrentValue - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  const byCategory = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + h.currentValue
    return acc
  }, {})

  const targetByCategory: Record<string, number> = {
    equity: profile?.target_equity_pct ?? 0,
    debt: profile?.target_debt_pct ?? 0,
    gold: profile?.target_gold_pct ?? 0,
    cash: profile?.target_cash_pct ?? 0,
    other: 0,
  }

  const categoriesPresent = new Set([...ALLOCATION_CATEGORIES, ...Object.keys(byCategory)])
  const rebalanceThresholdPct = profile?.rebalance_threshold_pct ?? DEFAULT_REBALANCE_THRESHOLD_PCT

  const allocation: AllocationSlice[] = Array.from(categoriesPresent)
    .filter((category) => (byCategory[category] ?? 0) > 0 || (targetByCategory[category] ?? 0) > 0)
    .map((category) => {
      const pct = totalCurrentValue > 0 ? ((byCategory[category] ?? 0) / totalCurrentValue) * 100 : 0
      const targetPct = targetByCategory[category] ?? 0
      const driftPct = pct - targetPct
      return {
        category,
        value: byCategory[category] ?? 0,
        pct,
        targetPct,
        driftPct,
        needsRebalance: targetPct > 0 && Math.abs(driftPct) >= rebalanceThresholdPct,
      }
    })
    .sort((a, b) => b.value - a.value)

  return {
    holdings,
    totalInvested,
    totalCurrentValue,
    totalGain,
    totalGainPct,
    allocation,
    netWorth: cashBalance + totalCurrentValue,
    riskProfile: profile?.risk_profile ?? "balanced",
    rebalanceThresholdPct,
  }
}
