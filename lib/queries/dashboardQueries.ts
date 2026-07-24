import { prisma } from "@/lib/prisma"

export type DashboardMetrics = {
  currentBalance: number
  monthlyIncome: number
  monthlyExpense: number
  savingsRate: number
  budgetUtilization: number
  monthOverMonthChange: number
  incomeChange: number
  expenseChange: number
}

export type ExpenseCategorySlice = {
  name: string
  value: number
  color: string
}

export type RecentTransaction = {
  id: string
  amount: number
  type: "INCOME" | "EXPENSE"
  description: string
  category: string
  date: string
}

export type DayCashFlow = {
  day: string
  inflow: number
  outflow: number
}

const CATEGORY_PALETTE = [
  "#6D55E3", "#A48FF6", "#3D9BD0", "#E89B3C", "#18A87E", "#E04B4B", "#0EA5E9", "#8B5CF6", "#9A98AC",
]

function categoryColor(index: number): string {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
}

function monthRange(offsetMonths: number, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth() + offsetMonths, 1)
  const end = new Date(from.getFullYear(), from.getMonth() + offsetMonths + 1, 1)
  return { start, end }
}

function safeChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1
  return (current - previous) / Math.abs(previous)
}

export async function getCurrentBalance(): Promise<number> {
  const transactions = await prisma.transaction.findMany({ select: { amount: true, type: true } })
  return transactions.reduce((total, t) => (t.type === "income" ? total + t.amount : total - t.amount), 0)
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date()
  const { start: thisStart, end: thisEnd } = monthRange(0, now)
  const { start: prevStart, end: prevEnd } = monthRange(-1, now)

  const [allTransactions, thisMonth, prevMonth, budgets] = await Promise.all([
    prisma.transaction.findMany({ select: { amount: true, type: true } }),
    prisma.transaction.findMany({
      where: { date: { gte: thisStart, lt: thisEnd } },
      select: { amount: true, type: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: prevStart, lt: prevEnd } },
      select: { amount: true, type: true },
    }),
    prisma.budget.findMany({ select: { monthly_limit: true, category: true } }),
  ])

  const currentBalance = allTransactions.reduce(
    (total, t) => (t.type === "income" ? total + t.amount : total - t.amount),
    0
  )

  const sumBy = (rows: { amount: number; type: string }[], type: string) =>
    rows.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0)

  const monthlyIncome = sumBy(thisMonth, "income")
  const monthlyExpense = sumBy(thisMonth, "expense")
  const prevIncome = sumBy(prevMonth, "income")
  const prevExpense = sumBy(prevMonth, "expense")

  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0

  const spentByCategory = thisMonth
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})

  const budgetTotal = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const budgetSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category] ?? 0), 0)
  const budgetUtilization = budgetTotal > 0 ? budgetSpent / budgetTotal : 0

  const currentNet = monthlyIncome - monthlyExpense
  const prevNet = prevIncome - prevExpense

  return {
    currentBalance,
    monthlyIncome,
    monthlyExpense,
    savingsRate,
    budgetUtilization,
    monthOverMonthChange: safeChange(currentNet, prevNet),
    incomeChange: safeChange(monthlyIncome, prevIncome),
    expenseChange: safeChange(monthlyExpense, prevExpense),
  }
}

export async function getExpenseBreakdown(): Promise<ExpenseCategorySlice[]> {
  const now = new Date()
  const { start, end } = monthRange(0, now)

  const rows = await prisma.transaction.findMany({
    where: { type: "expense", date: { gte: start, lt: end } },
    select: { category: true, amount: true },
  })

  const totals = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + r.amount
    return acc
  }, {})

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], index) => ({ name, value, color: categoryColor(index) }))
}

export async function getRecentTransactions(limit = 5): Promise<RecentTransaction[]> {
  const rows = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: limit,
    select: { id: true, amount: true, type: true, category: true, note: true, date: true },
  })

  return rows.map((r) => ({
    id: r.id,
    amount: r.type === "expense" ? -r.amount : r.amount,
    type: r.type === "income" ? "INCOME" : "EXPENSE",
    description: r.note?.trim() || r.category,
    category: r.category,
    date: r.date.toISOString(),
  }))
}

export async function getWeeklyCashFlow(): Promise<DayCashFlow[]> {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  const rows = await prisma.transaction.findMany({
    where: { date: { gte: start } },
    select: { amount: true, type: true, date: true },
  })

  const byDay = new Map<string, { inflow: number; outflow: number }>()
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    byDay.set(d.toDateString(), { inflow: 0, outflow: 0 })
  }

  for (const row of rows) {
    const key = new Date(row.date).toDateString()
    const bucket = byDay.get(key)
    if (!bucket) continue
    if (row.type === "income") bucket.inflow += row.amount
    else bucket.outflow += row.amount
  }

  return Array.from(byDay.entries()).map(([dateStr, values]) => ({
    day: new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" }),
    ...values,
  }))
}
