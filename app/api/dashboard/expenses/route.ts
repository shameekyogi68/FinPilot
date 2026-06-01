import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  let data
  try {
    data = await prisma.transaction.findMany({
      where: {
        type: "expense",
        date: {
          gte: monthStart,
          lt: nextMonth,
        },
      },
      select: { category: true, amount: true },
    })
  } catch (error) {
    return safeErrorResponse(error, "Failed to load expenses")
  }

  const categories = (data ?? []).reduce<Record<string, number>>((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount
    return acc
  }, {})

  const slices = Object.entries(categories).map(([category, amount]) => ({ category, amount }))

  return NextResponse.json(slices)
}
