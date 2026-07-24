import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

const currencyValues = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"] as const
const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  currency: z.enum(currencyValues),
  monthly_income: z.number().nonnegative(),
  savings_target: z.number().nonnegative().optional(),
  theme: z.enum(["light", "dark"]),
  default_month_view: z.enum(["current", "last"]),
  ai_enabled: z.boolean(),
  income_averaging_months: z.number().int().min(1).max(12).optional(),
  safety_buffer_months: z.number().min(0).max(24).optional(),
  target_equity_pct: z.number().min(0).max(100).optional(),
  target_debt_pct: z.number().min(0).max(100).optional(),
  target_gold_pct: z.number().min(0).max(100).optional(),
  target_cash_pct: z.number().min(0).max(100).optional(),
  risk_profile: z.enum(["conservative", "balanced", "aggressive"]).optional(),
  rebalance_threshold_pct: z.number().min(1).max(25).optional(),
})

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "You",
        currency: "INR",
        monthly_income: 0,
        savings_target: 0,
        theme: "dark",
        default_month_view: "current",
        ai_enabled: true,
      },
    })
    return NextResponse.json(profile)
  } catch (error) {
    return safeErrorResponse(error, "Failed to load profile")
  }
}

export async function PATCH(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => null)
  const parseResult = profileSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues.map((issue) => issue.message).join(", "),
      },
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: {
        name: data.name,
        email: data.email ?? null,
        currency: data.currency,
        monthly_income: data.monthly_income,
        savings_target: data.savings_target ?? 0,
        theme: data.theme,
        default_month_view: data.default_month_view,
        ai_enabled: data.ai_enabled,
        ...(data.income_averaging_months !== undefined ? { income_averaging_months: data.income_averaging_months } : {}),
        ...(data.safety_buffer_months !== undefined ? { safety_buffer_months: data.safety_buffer_months } : {}),
        ...(data.target_equity_pct !== undefined ? { target_equity_pct: data.target_equity_pct } : {}),
        ...(data.target_debt_pct !== undefined ? { target_debt_pct: data.target_debt_pct } : {}),
        ...(data.target_gold_pct !== undefined ? { target_gold_pct: data.target_gold_pct } : {}),
        ...(data.target_cash_pct !== undefined ? { target_cash_pct: data.target_cash_pct } : {}),
        ...(data.risk_profile !== undefined ? { risk_profile: data.risk_profile } : {}),
        ...(data.rebalance_threshold_pct !== undefined ? { rebalance_threshold_pct: data.rebalance_threshold_pct } : {}),
      },
      create: {
        id: 1,
        name: data.name,
        email: data.email ?? null,
        currency: data.currency,
        monthly_income: data.monthly_income,
        savings_target: data.savings_target ?? 0,
        theme: data.theme,
        default_month_view: data.default_month_view,
        ai_enabled: data.ai_enabled,
        income_averaging_months: data.income_averaging_months ?? 3,
        safety_buffer_months: data.safety_buffer_months ?? 3,
        target_equity_pct: data.target_equity_pct ?? 0,
        target_debt_pct: data.target_debt_pct ?? 0,
        target_gold_pct: data.target_gold_pct ?? 0,
        target_cash_pct: data.target_cash_pct ?? 0,
        risk_profile: data.risk_profile ?? "balanced",
        rebalance_threshold_pct: data.rebalance_threshold_pct ?? 5,
      }
    })
    return NextResponse.json({ status: "ok", profile })
  } catch (error) {
    return safeErrorResponse(error, "Failed to update profile")
  }
}
