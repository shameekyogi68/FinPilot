import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("amount,type,date")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const transactions = data ?? []
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartIso = monthStart.toISOString()

  const currentBalance = transactions.reduce((total, transaction) => {
    if (transaction.type === "income") {
      return total + transaction.amount
    }
    return total - transaction.amount
  }, 0)

  const monthlyIncome = transactions.reduce((total, transaction) => {
    return transaction.type === "income" && new Date(transaction.date) >= monthStart
      ? total + transaction.amount
      : total
  }, 0)

  const monthlyExpenses = transactions.reduce((total, transaction) => {
    return transaction.type === "expense" && new Date(transaction.date) >= monthStart
      ? total + transaction.amount
      : total
  }, 0)

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : null

  return NextResponse.json({
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
  })
}
