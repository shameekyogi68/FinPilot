import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchLatestPrice } from "@/lib/services/marketData"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  const { id } = await params
  const holding = await prisma.investment.findUnique({ where: { id } }).catch(() => null)

  if (!holding) {
    return NextResponse.json({ error: "Holding not found" }, { status: 404 })
  }
  if (!holding.symbol) {
    return NextResponse.json({ error: "Add a symbol / scheme code to this holding first" }, { status: 400 })
  }
  if (!holding.units || holding.units <= 0) {
    return NextResponse.json({ error: "Add the number of units this holding represents first" }, { status: 400 })
  }

  try {
    const quote = await fetchLatestPrice(holding.type, holding.symbol)
    const investment = await prisma.investment.update({
      where: { id },
      data: { currentValue: quote.price * holding.units },
    })
    return NextResponse.json({ investment, quote })
  } catch (error) {
    return safeErrorResponse(error, "Failed to refresh price")
  }
}
