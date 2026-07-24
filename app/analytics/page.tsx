import { AnalyticsClient } from "@/components/analytics/AnalyticsClient"
import {
  getCategoryBreakdown,
  getDailySpending,
  getLast6MonthsTrend,
  getMonthlySummary,
} from "@/lib/queries/analyticsQueries"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [monthlySummary, last6MonthsTrend, categoryBreakdown, dailySpending] = await Promise.all([
    getMonthlySummary(month, year),
    getLast6MonthsTrend(),
    getCategoryBreakdown(month, year),
    getDailySpending(month, year),
  ])

  return (
    <AnalyticsClient
      monthlySummary={monthlySummary}
      last6MonthsTrend={last6MonthsTrend}
      categoryBreakdown={categoryBreakdown}
      dailySpending={dailySpending}
      month={month}
      year={year}
    />
  )
}
