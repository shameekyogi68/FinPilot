import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const { data, error } = await supabase
    .from("transactions")
    .select("category,amount")
    .eq("type", "expense")
    .gte("date", monthStart.toISOString())
    .lt("date", nextMonth.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const categories = (data ?? []).reduce<Record<string, number>>((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount
    return acc
  }, {})

  const slices = Object.entries(categories).map(([category, amount]) => ({ category, amount }))

  return NextResponse.json(slices)
}
