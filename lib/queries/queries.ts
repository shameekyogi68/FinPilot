import { prisma } from "@/lib/prisma"

export type BudgetWithSpend = {
  id: string
  category: string
  monthly_limit: number
  essential: boolean
  spent_this_month: number
}

export async function getBudgetsWithSpend(): Promise<BudgetWithSpend[]> {
  const [budgets, { groupedByCategory }] = await Promise.all([
    prisma.budget.findMany({
      select: { id: true, category: true, monthly_limit: true, essential: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentMonthExpenses(),
  ])

  return budgets.map((budget) => ({
    ...budget,
    spent_this_month: groupedByCategory[budget.category] ?? 0,
  }))
}

export type OverspendHistory = {
  avgMonthlyOverspend: number
  monthsConsidered: number
}

/** Non-essential budgets only, compared against transactions from each of the trailing `monthsBack` complete months. */
export async function getAverageMonthlyOverspend(monthsBack = 3): Promise<OverspendHistory> {
  const budgets = await prisma.budget.findMany({
    where: { essential: false },
    select: { category: true, monthly_limit: true },
  })

  if (budgets.length === 0) {
    return { avgMonthlyOverspend: 0, monthsConsidered: 0 }
  }

  const now = new Date()
  let totalOverspend = 0
  let monthsWithData = 0

  for (let i = 1; i <= monthsBack; i += 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const rows = await prisma.transaction.findMany({
      where: {
        type: "expense",
        date: { gte: start, lt: end },
        category: { in: budgets.map((b) => b.category) },
      },
      select: { category: true, amount: true },
    })

    if (rows.length === 0) continue

    const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + r.amount
      return acc
    }, {})

    const monthOverspend = budgets.reduce((sum, b) => sum + Math.max(0, (byCategory[b.category] ?? 0) - b.monthly_limit), 0)
    totalOverspend += monthOverspend
    monthsWithData += 1
  }

  return {
    avgMonthlyOverspend: monthsWithData > 0 ? totalOverspend / monthsWithData : 0,
    monthsConsidered: monthsWithData,
  }
}

export async function getCurrentMonthExpenses() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: monthStart,
        lt: nextMonth,
      },
    },
    select: { id: true, category: true, amount: true, date: true, type: true, note: true },
  })

  const expenses = transactions.filter(t => t.type === "expense")
  const currentMonthIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const groupedByCategory = expenses.reduce<Record<string, number>>((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount
    return acc
  }, {})

  return { rawExpenses: expenses, groupedByCategory, currentMonthIncome }
}
