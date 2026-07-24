import { prisma } from "@/lib/prisma"
import { getCurrentBalance } from "@/lib/queries/dashboardQueries"

export type IncomeVolatility = "steady" | "variable" | "highly_variable" | "unknown"

export type RunwayMetrics = {
  avgMonthlyIncome: number
  avgMonthlyExpense: number
  currentBalance: number
  runwayMonths: number | null
  incomeVolatility: IncomeVolatility
  essentialMonthlyFloor: number
  safetyBufferTargetMonths: number
  safetyBufferTargetAmount: number
  bufferGap: number
  monthsConsidered: number
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

function stdev(values: number[], mean: number) {
  if (values.length < 2) return 0
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export async function getRunwayMetrics(): Promise<RunwayMetrics> {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null)
  const windowMonths = profile?.income_averaging_months ?? 3
  const safetyBufferTargetMonths = profile?.safety_buffer_months ?? 3

  const now = new Date()
  const windowStart = new Date(now.getFullYear(), now.getMonth() - windowMonths, 1)

  const [transactions, essentialBudgets, currentBalance] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: windowStart } },
      select: { amount: true, type: true, date: true },
    }),
    prisma.budget.findMany({ where: { essential: true }, select: { monthly_limit: true } }),
    getCurrentBalance(),
  ])

  const currentMonthKey = monthKey(now)
  const perMonth = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    const key = monthKey(new Date(t.date))
    if (key === currentMonthKey) continue // exclude the current, still-incomplete month
    const bucket = perMonth.get(key) ?? { income: 0, expense: 0 }
    if (t.type === "income") bucket.income += t.amount
    else bucket.expense += t.amount
    perMonth.set(key, bucket)
  }

  const months = Array.from(perMonth.values())
  const monthsConsidered = months.length

  let avgMonthlyIncome: number
  let avgMonthlyExpense: number
  let incomeVolatility: IncomeVolatility

  if (monthsConsidered === 0) {
    // No complete prior month yet — fall back to month-to-date so a brand new user still sees a number.
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const mtd = transactions.filter((t) => new Date(t.date) >= monthStart)
    avgMonthlyIncome = mtd.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    avgMonthlyExpense = mtd.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    incomeVolatility = "unknown"
  } else {
    const incomes = months.map((m) => m.income)
    const expenses = months.map((m) => m.expense)
    avgMonthlyIncome = incomes.reduce((s, v) => s + v, 0) / monthsConsidered
    avgMonthlyExpense = expenses.reduce((s, v) => s + v, 0) / monthsConsidered

    if (monthsConsidered < 2 || avgMonthlyIncome === 0) {
      incomeVolatility = "unknown"
    } else {
      const cv = stdev(incomes, avgMonthlyIncome) / avgMonthlyIncome
      incomeVolatility = cv < 0.15 ? "steady" : cv < 0.4 ? "variable" : "highly_variable"
    }
  }

  const essentialMonthlyFloor = essentialBudgets.reduce((s, b) => s + b.monthly_limit, 0)
  const safetyBufferTargetAmount = avgMonthlyExpense * safetyBufferTargetMonths
  const runwayMonths = avgMonthlyExpense > 0 ? currentBalance / avgMonthlyExpense : null

  return {
    avgMonthlyIncome,
    avgMonthlyExpense,
    currentBalance,
    runwayMonths,
    incomeVolatility,
    essentialMonthlyFloor,
    safetyBufferTargetMonths,
    safetyBufferTargetAmount,
    bufferGap: safetyBufferTargetAmount - currentBalance,
    monthsConsidered,
  }
}
