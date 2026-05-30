import { createSupabaseAdmin } from "@/lib/supabaseAdmin"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function getCurrentMonthExpenses(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? createSupabaseAdmin()
  if (!supabase) {
    throw new Error("Missing Supabase service configuration")
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const { data, error } = await supabase
    .from("transactions")
    .select("id,category,amount,date,type,note")
    .eq("type", "expense")
    .gte("date", monthStart.toISOString())
    .lt("date", nextMonth.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  const expenses = data ?? []
  const groupedByCategory = expenses.reduce<Record<string, number>>((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount
    return acc
  }, {})

  return { rawExpenses: expenses, groupedByCategory }
}
