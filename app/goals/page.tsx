import { GoalsClient } from "@/components/goals/GoalsClient"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function GoalsPage() {
  const goals = await prisma.goal.findMany({ orderBy: { createdAt: "desc" } })
  const serialized = goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    deadline: g.deadline ? g.deadline.toISOString() : null,
  }))
  return <GoalsClient initialGoals={serialized} />
}
