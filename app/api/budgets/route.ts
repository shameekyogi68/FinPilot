import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getBudgetsWithSpend, getCurrentMonthExpenses } from "@/lib/queries/queries"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

const budgetSchema = z.object({
  category: z.string().min(1),
  monthly_limit: z
    .preprocess((value) => (typeof value === "string" ? Number(value) : value), z.number())
    .refine((value) => !Number.isNaN(value), { message: "Monthly limit is required" })
    .refine((value) => value >= 0, { message: "Monthly limit must be a positive number" }),
  essential: z.boolean().optional(),
})

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const [budgetsWithSpend, { rawExpenses, currentMonthIncome }] = await Promise.all([
      getBudgetsWithSpend(),
      getCurrentMonthExpenses(),
    ])

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

  const { category, monthly_limit, essential } = parseResult.data

  try {
    const budget = await prisma.budget.create({
      data: { category, monthly_limit, essential: essential ?? true },
    })
    return NextResponse.json({ status: "ok", budget })
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

  const { category, monthly_limit, essential } = parseResult.data

  try {
    await prisma.budget.update({
      where: { id },
      data: { category, monthly_limit, ...(essential !== undefined ? { essential } : {}) },
    })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to update budget")
  }
}

export async function DELETE(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing budget id" }, { status: 400 })
  }

  try {
    await prisma.budget.delete({ where: { id } })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete budget")
  }
}
