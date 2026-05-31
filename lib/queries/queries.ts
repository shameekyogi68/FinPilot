import { prisma } from "@/lib/prisma"

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
