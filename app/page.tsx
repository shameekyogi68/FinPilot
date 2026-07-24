import { OverviewClient } from "@/components/dashboard/OverviewClient"
import {
  getDashboardMetrics,
  getExpenseBreakdown,
  getRecentTransactions,
  getWeeklyCashFlow,
} from "@/lib/queries/dashboardQueries"
import { getRunwayMetrics } from "@/lib/queries/runwayQueries"
import { getPortfolioSummary } from "@/lib/queries/investmentQueries"
import { generateMonthlyInsights } from "@/services/ai/monthlyInsights"
import { generateMonthlyReview } from "@/services/ai/monthlyReview"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function currentMonthPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default async function Home() {
  const period = currentMonthPeriod()
  const [metrics, expenseData, recentTransactions, weeklyCashFlow, runway, portfolio, profile, insightsResult, reviewResult] =
    await Promise.all([
      getDashboardMetrics(),
      getExpenseBreakdown(),
      getRecentTransactions(5),
      getWeeklyCashFlow(),
      getRunwayMetrics(),
      getPortfolioSummary(),
      prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null),
      generateMonthlyInsights(period).catch(() => ({ insights: [] as string[] })),
      generateMonthlyReview(period).catch(() => null),
    ])

  return (
    <OverviewClient
      metrics={metrics}
      expenseData={expenseData}
      recentTransactions={recentTransactions}
      weeklyCashFlow={weeklyCashFlow}
      runway={runway}
      netWorth={portfolio.netWorth}
      investedValue={portfolio.totalCurrentValue}
      profileName={profile?.name || "there"}
      insights={insightsResult.insights}
      monthlyReview={reviewResult?.review ?? null}
      monthlyReviewLabel={period}
    />
  )
}
