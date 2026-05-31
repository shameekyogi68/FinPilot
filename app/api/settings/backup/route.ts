import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Authentication check
  const authError = authenticateRequest(request)
  if (authError) return authError

  // Rate limiting
  const rateLimitError = checkRateLimit(request, 10, 60_000) // 10 requests per minute
  if (rateLimitError) return rateLimitError

  try {
    logger.info("Starting full data backup")

    const [transactions, budgets, goals, profile] = await Promise.all([
      prisma.transaction.findMany(),
      prisma.budget.findMany(),
      prisma.goal.findMany(),
      prisma.profile.findFirst(),
    ])

    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        budgets,
        goals,
        profile,
      },
    }

    logger.info("Backup completed successfully", { 
      transactionCount: transactions.length,
      budgetCount: budgets.length,
      goalCount: goals.length,
    })

    return NextResponse.json(backupData)
  } catch (error) {
    return safeErrorResponse(error, "Backup")
  }
}

export async function POST(request: Request) {
  // Authentication check
  const authError = authenticateRequest(request)
  if (authError) return authError

  // Rate limiting
  const rateLimitError = checkRateLimit(request, 2, 60_000) // 2 restore requests per minute
  if (rateLimitError) return rateLimitError

  try {
    const backupData = await request.json() as { version?: string; data?: { transactions?: unknown[]; budgets?: unknown[]; goals?: unknown[]; profile?: unknown } }

    if (!backupData.data) {
      return NextResponse.json({ error: "Invalid backup data" }, { status: 400 })
    }

    // Validate backup version
    if (backupData.version && backupData.version !== "1.0") {
      logger.warn("Unsupported backup version", { version: backupData.version })
      return NextResponse.json({ error: "Unsupported backup version" }, { status: 400 })
    }

    logger.info("Starting data restore", { version: backupData.version })

    const { transactions, budgets, goals, profile } = backupData.data

    // Use transaction to ensure atomicity - if anything fails, nothing is deleted
    await prisma.$transaction(async (tx) => {
      // Restore transactions
      if (Array.isArray(transactions) && transactions.length > 0) {
        await tx.transaction.deleteMany()
        const txData = transactions.map((t: unknown) => {
          const tx = t as { amount: unknown; type: unknown; category: unknown; date: unknown; note?: unknown }
          return {
            amount: Number(tx.amount),
            type: tx.type as "income" | "expense",
            category: String(tx.category),
            date: new Date(String(tx.date)),
            note: tx.note ? String(tx.note) : null,
          }
        })
        await tx.transaction.createMany({
          data: txData,
        })
      }

      // Restore budgets
      if (Array.isArray(budgets) && budgets.length > 0) {
        await tx.budget.deleteMany()
        const budgetData = budgets.map((b: unknown) => {
          const budget = b as { category: unknown; monthly_limit: unknown }
          return {
            category: String(budget.category),
            monthly_limit: Number(budget.monthly_limit),
          }
        })
        await tx.budget.createMany({
          data: budgetData,
        })
      }

      // Restore goals
      if (Array.isArray(goals) && goals.length > 0) {
        await tx.goal.deleteMany()
        const goalData = goals.map((g: unknown) => {
          const goal = g as { name: unknown; targetAmount: unknown; currentAmount: unknown; targetDate?: unknown }
          return {
            name: String(goal.name),
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            targetDate: goal.targetDate ? new Date(String(goal.targetDate)) : null,
          }
        })
        await tx.goal.createMany({
          data: goalData,
        })
      }

      // Restore profile
      if (profile) {
        await tx.profile.deleteMany()
        const profileData = profile as { name?: string; email?: string; currency?: string; monthly_income?: unknown; savings_target?: unknown; theme?: string; default_month_view?: string; ai_enabled?: unknown }
        await tx.profile.create({
          data: {
            name: profileData.name || "Shameek Yogi",
            email: profileData.email || null,
            currency: profileData.currency || "INR",
            monthly_income: Number(profileData.monthly_income) || 0,
            savings_target: Number(profileData.savings_target) || 0,
            theme: profileData.theme || "dark",
            default_month_view: profileData.default_month_view || "current",
            ai_enabled: profileData.ai_enabled !== undefined ? Boolean(profileData.ai_enabled) : true,
          },
        })
      }
    })

    logger.info("Restore completed successfully")

    return NextResponse.json({ success: true, message: "Data restored successfully" })
  } catch (error) {
    return safeErrorResponse(error, "Restore")
  }
}
