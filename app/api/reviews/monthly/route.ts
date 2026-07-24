import { NextResponse } from "next/server"
import { generateMonthlyReview } from "@/services/ai/monthlyReview"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = "force-dynamic"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const period = url.searchParams.get("period") || currentPeriod()
  const refresh = url.searchParams.get("refresh") === "true"

  if (!/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "Invalid period format, expected YYYY-MM" }, { status: 400 })
  }

  try {
    const result = await generateMonthlyReview(period, refresh)
    return NextResponse.json(result)
  } catch (error) {
    return safeErrorResponse(error, "Failed to load monthly review")
  }
}
