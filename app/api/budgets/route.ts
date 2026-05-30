import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseAdmin } from "@/lib/supabaseAdmin"
import { getCurrentMonthExpenses } from "@/lib/supabase/queries"

const budgetSchema = z.object({
  category: z.string().min(1),
  monthly_limit: z
    .preprocess((value) => (typeof value === "string" ? Number(value) : value), z.number())
    .refine((value) => !Number.isNaN(value), { message: "Monthly limit is required" })
    .refine((value) => value >= 0, { message: "Monthly limit must be a positive number" }),
})

export async function GET() {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  const { data: budgets, error: budgetError } = await supabase
    .from("budgets")
    .select("id,category,monthly_limit")

  if (budgetError) {
    return NextResponse.json({ error: budgetError.message }, { status: 500 })
  }

  try {
    const { rawExpenses, groupedByCategory } = await getCurrentMonthExpenses(supabase)

    const budgetsWithSpend = (budgets ?? []).map((budget) => ({
      ...budget,
      spent_this_month: groupedByCategory[budget.category] ?? 0,
    }))

    return NextResponse.json({ budgets: budgetsWithSpend, currentMonthExpenses: rawExpenses })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load expenses" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = budgetSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    )
  }

  const { category, monthly_limit } = parseResult.data
  const { error } = await supabase.from("budgets").insert({ category, monthly_limit })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing budget id" }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = budgetSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    )
  }

  const { category, monthly_limit } = parseResult.data
  const parsedId = Number(id)
  const updateQuery = Number.isNaN(parsedId)
    ? supabase.from("budgets").update({ category, monthly_limit }).eq("id", id)
    : supabase.from("budgets").update({ category, monthly_limit }).eq("id", parsedId)

  const { error } = await updateQuery
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
