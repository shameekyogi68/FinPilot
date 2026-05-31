import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentMonthExpenses } from "@/lib/queries/queries"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

const budgetSchema = z.object({
  category: z.string().min(1),
  monthly_limit: z
    .preprocess((value) => (typeof value === "string" ? Number(value) : value), z.number())
    .refine((value) => !Number.isNaN(value), { message: "Monthly limit is required" })
    .refine((value) => value >= 0, { message: "Monthly limit must be a positive number" }),
})

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const budgets = await prisma.budget.findMany({
      select: { id: true, category: true, monthly_limit: true },
    })

    const { rawExpenses, groupedByCategory, currentMonthIncome } = await getCurrentMonthExpenses()

    const budgetsWithSpend = (budgets ?? []).map((budget) => ({
      ...budget,
      spent_this_month: groupedByCategory[budget.category] ?? 0,
    }))

    return NextResponse.json({ budgets: budgetsWithSpend, currentMonthExpenses: rawExpenses, currentMonthIncome })
  } catch (error) {
    return safeErrorResponse(error, "Failed to load budgets")
  }
}

export async function POST(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => null)
  const parseResult = budgetSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    )
  }

  const { category, monthly_limit } = parseResult.data

  try {
    await prisma.budget.create({
      data: { category, monthly_limit },
    })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to create budget")
  }
}

export async function PATCH(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

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

  try {
    await prisma.budget.update({
      where: { id },
      data: { category, monthly_limit },
    })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to update budget")
  }
}
