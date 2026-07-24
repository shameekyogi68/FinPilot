import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getPortfolioSummary } from "@/lib/queries/investmentQueries"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = "force-dynamic"

const investmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["stock", "equity_mf", "debt_mf", "fd", "ppf", "gold", "other"]),
  category: z.enum(["equity", "debt", "gold", "cash", "other"]),
  investedAmount: z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
  units: z.number().positive().optional().nullable(),
  symbol: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const summary = await getPortfolioSummary()
    return NextResponse.json(summary)
  } catch (error) {
    return safeErrorResponse(error, "Failed to load investments")
  }
}

export async function POST(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => null)
  const parseResult = investmentSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    )
  }

  const { name, type, category, investedAmount, currentValue, units, symbol, purchaseDate, notes } = parseResult.data

  try {
    const investment = await prisma.investment.create({
      data: {
        name,
        type,
        category,
        investedAmount,
        currentValue,
        units: units ?? null,
        symbol: symbol?.trim() || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes: notes ?? null,
      },
    })
    return NextResponse.json(investment, { status: 201 })
  } catch (error) {
    return safeErrorResponse(error, "Failed to create investment")
  }
}
