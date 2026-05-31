import { NextResponse } from "next/server"
import {
  getCategoryBreakdown,
  getDailySpending,
  getLast6MonthsTrend,
  getMonthlySummary,
  getYearlyTrend,
} from "@/lib/queries/analyticsQueries"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 50, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear()

  if (!month || !year) {
    return NextResponse.json({ error: "Missing month or year" }, { status: 400 })
  }

  try {
    const [monthlySummary, last6MonthsTrend, yearlyTrend, categoryBreakdown, dailySpending] =
      await Promise.all([
        getMonthlySummary(month, year),
        getLast6MonthsTrend(),
        getYearlyTrend(year),
        getCategoryBreakdown(month, year),
        getDailySpending(month, year),
      ])

    return NextResponse.json({
      month,
      year,
      monthlySummary,
      last6MonthsTrend,
      yearlyTrend,
      categoryBreakdown,
      dailySpending,
    })
  } catch (error) {
    return safeErrorResponse(error, "Failed to load analytics")
  }
}
