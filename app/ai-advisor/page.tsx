import { AdvisorClient } from "@/components/ai-advisor/AdvisorClient"
import { getDashboardMetrics } from "@/lib/queries/dashboardQueries"
import { getRunwayMetrics } from "@/lib/queries/runwayQueries"

export const dynamic = "force-dynamic"

export default async function AIAdvisorPage() {
  const [metrics, runway] = await Promise.all([getDashboardMetrics(), getRunwayMetrics()])

  const initialMessages = [
    {
      id: "welcome",
      role: "assistant" as const,
      content:
        "Hi! I'm your Runway advisor. I have full context of your real transactions, budgets, and goals — ask me anything about your spending, saving strategy, or how to plan around your irregular income.",
      createdAt: new Date().toISOString(),
    },
  ]

  return <AdvisorClient initialMessages={initialMessages} metrics={metrics} runway={runway} />
}
