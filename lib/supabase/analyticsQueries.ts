import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseAdmin } from "@/lib/supabaseAdmin"

const getSupabase = (supabaseClient?: SupabaseClient) => {
  return supabaseClient ?? createSupabaseAdmin()
}

const monthKey = (year: number, month: number) => `${year}-${month.toString().padStart(2, "0")}`

const monthLabel = (year: number, month: number) => {
  return `${new Date(year, month - 1, 1).toLocaleString("default", { month: "long" })} ${year}`
}

const getMonthRange = (month: number, year: number) => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}

export async function getMonthlySummary(month: number, year: number) {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Missing Supabase service configuration")

  const { start, end } = getMonthRange(month, year)
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type")
    .gte("date", start.toISOString())
    .lt("date", end.toISOString())

  if (error) throw new Error(error.message)

  const income = data?.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0) ?? 0
  const expense = data?.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0) ?? 0
  const net = income - expense
  const savingsRate = income > 0 ? (net / income) * 100 : 0

  return {
    month,
    year,
    monthLabel: monthLabel(year, month),
    income,
    expense,
    net,
    savingsRate,
  }
}

export async function getLast6MonthsTrend() {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Missing Supabase service configuration")

  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .gte("date", startDate.toISOString())
    .lt("date", endDate.toISOString())

  if (error) throw new Error(error.message)

  const grouped = new Map<string, { income: number; expense: number }>()

  ;(data ?? []).forEach((row) => {
    const date = new Date(row.date)
    const key = monthKey(date.getFullYear(), date.getMonth() + 1)
    const existing = grouped.get(key) ?? { income: 0, expense: 0 }
    if (row.type === "income") {
      existing.income += row.amount
    } else if (row.type === "expense") {
      existing.expense += row.amount
    }
    grouped.set(key, existing)
  })

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1)
    const key = monthKey(date.getFullYear(), date.getMonth() + 1)
    const values = grouped.get(key) ?? { income: 0, expense: 0 }
    const net = values.income - values.expense
    const savingsRate = values.income > 0 ? (net / values.income) * 100 : 0

    return {
      month: date.toLocaleString("default", { month: "short" }),
      year: date.getFullYear(),
      income: values.income,
      expense: values.expense,
      net,
      savingsRate,
    }
  })
}

export async function getYearlyTrend(year: number) {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Missing Supabase service configuration")

  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .gte("date", start.toISOString())
    .lt("date", end.toISOString())

  if (error) throw new Error(error.message)

  const grouped = new Map<string, { expense: number }>()

  ;(data ?? []).forEach((row) => {
    if (row.type !== "expense") return
    const date = new Date(row.date)
    const key = monthKey(date.getFullYear(), date.getMonth() + 1)
    const existing = grouped.get(key) ?? { expense: 0 }
    existing.expense += row.amount
    grouped.set(key, existing)
  })

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const date = new Date(year, index, 1)
    const key = monthKey(year, month)
    const values = grouped.get(key) ?? { expense: 0 }

    return {
      month: date.toLocaleString("default", { month: "short" }),
      year,
      expense: values.expense,
    }
  })
}

export async function getCategoryBreakdown(month: number, year: number) {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Missing Supabase service configuration")

  const { start, end } = getMonthRange(month, year)
  const { data, error } = await supabase
    .from("transactions")
    .select("category, amount")
    .eq("type", "expense")
    .gte("date", start.toISOString())
    .lt("date", end.toISOString())

  if (error) throw new Error(error.message)

  const breakdown: Record<string, number> = {}
  ;(data ?? []).forEach((row) => {
    breakdown[row.category] = (breakdown[row.category] || 0) + row.amount
  })

  return Object.entries(breakdown).map(([category, amount]) => ({ category, amount }))
}

export async function getDailySpending(month: number, year: number) {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Missing Supabase service configuration")

  const { start, end } = getMonthRange(month, year)
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("type", "expense")
    .gte("date", start.toISOString())
    .lt("date", end.toISOString())

  if (error) throw new Error(error.message)

  const daily: Record<number, number> = {}
  ;(data ?? []).forEach((row) => {
    const date = new Date(row.date)
    const day = date.getDate()
    daily[day] = (daily[day] || 0) + row.amount
  })

  return Object.entries(daily).map(([day, amount]) => ({
    day: Number(day),
    amount,
  }))
}
