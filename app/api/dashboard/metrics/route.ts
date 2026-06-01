import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  let transactions
  try {
    transactions = await prisma.transaction.findMany({
      select: { amount: true, type: true, date: true }
    })
  } catch (error) {
    return safeErrorResponse(error, "Failed to load metrics")
  }
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const currentBalance = transactions.reduce((total, transaction) => {
    if (transaction.type === "income") {
      return total + transaction.amount
    }
    return total - transaction.amount
  }, 0)

  const monthlyIncome = transactions.reduce((total, transaction) => {
    return transaction.type === "income" && new Date(transaction.date) >= monthStart
      ? total + transaction.amount
      : total
  }, 0)

  const monthlyExpenses = transactions.reduce((total, transaction) => {
    return transaction.type === "expense" && new Date(transaction.date) >= monthStart
      ? total + transaction.amount
      : total
  }, 0)

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : null

  return NextResponse.json({
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
  })
}
