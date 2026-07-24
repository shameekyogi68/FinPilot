import { TransactionsClient } from "@/components/transactions/TransactionsClient"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const rows = await prisma.transaction.findMany({ orderBy: { date: "desc" } })
  const transactions = rows.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type as "income" | "expense",
    category: t.category,
    note: t.note,
    date: t.date.toISOString(),
  }))
  return <TransactionsClient initialTransactions={transactions} />
}
