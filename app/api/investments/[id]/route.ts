import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["stock", "equity_mf", "debt_mf", "fd", "ppf", "gold", "other"]).optional(),
  category: z.enum(["equity", "debt", "gold", "cash", "other"]).optional(),
  investedAmount: z.number().nonnegative().optional(),
  currentValue: z.number().nonnegative().optional(),
  units: z.number().positive().optional().nullable(),
  symbol: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => null)
  const parseResult = updateSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    )
  }

  const { purchaseDate, symbol, ...rest } = parseResult.data

  try {
    const { id } = await params
    const investment = await prisma.investment.update({
      where: { id },
      data: {
        ...rest,
        ...(symbol !== undefined ? { symbol: symbol?.trim() || null } : {}),
        ...(purchaseDate !== undefined ? { purchaseDate: purchaseDate ? new Date(purchaseDate) : null } : {}),
      },
    })
    return NextResponse.json(investment)
  } catch (error) {
    return safeErrorResponse(error, "Failed to update investment")
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const { id } = await params
    await prisma.investment.delete({ where: { id } })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete investment")
  }
}
