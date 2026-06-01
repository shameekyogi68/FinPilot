import { NextResponse } from "next/server"
import { generateMonthlyInsights } from "@/services/ai/monthlyInsights"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const month = url.searchParams.get("month")
  const refresh = url.searchParams.get("refresh") === "true"

  if (!month) {
    return NextResponse.json({ error: "Missing month" }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month format" }, { status: 400 })
  }

  try {
    const result = await generateMonthlyInsights(month, refresh)

    return NextResponse.json(
      { insights: result.insights, updatedAt: result.updatedAt },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error) {
    return safeErrorResponse(error, "Failed to load insights")
  }
}
