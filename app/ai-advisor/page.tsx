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
        "Greetings Shameek Yogi! I am your Yogi's Wealth AI advisor. I have full context of your real transactions, budgets, goals, and mutual fund portfolio — ask me anything about your spending control, investment strategy, or wealth accumulation.",
      createdAt: new Date().toISOString(),
    },
  ]

  return <AdvisorClient initialMessages={initialMessages} metrics={metrics} runway={runway} />
}
