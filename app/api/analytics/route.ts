import { NextResponse } from "next/server"
import {
  getCategoryBreakdown,
  getDailySpending,
  getLast6MonthsTrend,
  getMonthlySummary,
  getYearlyTrend,
} from "@/lib/queries/analyticsQueries"

export async function GET(request: Request) {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load analytics data" },
      { status: 500 }
    )
  }
}
