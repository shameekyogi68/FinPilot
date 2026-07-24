import { InvestmentsClient } from "@/components/investments/InvestmentsClient"
import { getPortfolioSummary } from "@/lib/queries/investmentQueries"
import { getAverageMonthlyOverspend } from "@/lib/queries/queries"

export const dynamic = "force-dynamic"

export default async function InvestmentsPage() {
  const [summary, overspend] = await Promise.all([getPortfolioSummary(), getAverageMonthlyOverspend()])
  return <InvestmentsClient initialSummary={summary} overspend={overspend} />
}
