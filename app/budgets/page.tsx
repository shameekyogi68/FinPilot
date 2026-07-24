import { BudgetsClient } from "@/components/budgets/BudgetsClient"
import { getBudgetsWithSpend } from "@/lib/queries/queries"

export const dynamic = "force-dynamic"

export default async function BudgetsPage() {
  const budgets = await getBudgetsWithSpend()
  return <BudgetsClient initialBudgets={budgets} />
}
