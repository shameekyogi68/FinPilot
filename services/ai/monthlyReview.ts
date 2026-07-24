import { prisma } from "@/lib/prisma"
import { callOpenRouterChat, type OpenRouterMessage } from "@/services/ai/client"
import { getBudgetsWithSpend } from "@/lib/queries/queries"
import { getPortfolioSummary } from "@/lib/queries/investmentQueries"
import { getRunwayMetrics } from "@/lib/queries/runwayQueries"
import { getDashboardMetrics } from "@/lib/queries/dashboardQueries"

const INSIGHT_TYPE = "monthly_review"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

const monthLabel = (period: string) => {
  const [year, month] = period.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" })
}

type ReviewInputs = {
  period: string
  metrics: Awaited<ReturnType<typeof getDashboardMetrics>>
  budgets: Awaited<ReturnType<typeof getBudgetsWithSpend>>
  portfolio: Awaited<ReturnType<typeof getPortfolioSummary>>
  runway: Awaited<ReturnType<typeof getRunwayMetrics>>
  goals: Array<{ name: string; targetAmount: number; currentAmount: number }>
  riskProfile: string
}

// Priority order matches the discipline-first rule: overspending and emergency
// fund status come before allocation drift, no matter how aggressive the risk profile is.
function buildFallbackReview(inputs: ReviewInputs): string[] {
  const { metrics, budgets, portfolio, runway, goals } = inputs
  const lines: string[] = []

  const overNonEssential = budgets.filter((b) => !b.essential && b.spent_this_month > b.monthly_limit)
  if (overNonEssential.length > 0) {
    lines.push(
      `Overspent flexible budgets: ${overNonEssential.map((b) => `${b.category} by ₹${formatCurrency(b.spent_this_month - b.monthly_limit)}`).join(", ")}.`
    )
  } else if (budgets.some((b) => !b.essential)) {
    lines.push("Flexible/lifestyle budgets stayed within limit.")
  }

  const emergencyOk = runway.currentBalance >= runway.safetyBufferTargetAmount
  lines.push(
    `Emergency fund ${emergencyOk ? "at or above" : "below"} your ${runway.safetyBufferTargetMonths}-month target (balance ₹${formatCurrency(runway.currentBalance)}).`
  )

  const drifted = portfolio.allocation.filter((a) => a.needsRebalance)
  if (drifted.length > 0) {
    lines.push(
      `Allocation drift: ${drifted.map((a) => `${a.category} ${a.driftPct > 0 ? "over" : "under"} target by ${Math.abs(a.driftPct).toFixed(0)}pp`).join(", ")}.`
    )
  } else if (portfolio.holdings.length > 0) {
    lines.push("Allocation is within your own target bands.")
  }

  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount)
  if (activeGoals.length > 0) {
    const top = activeGoals[0]
    lines.push(`${top.name} is ${Math.round((top.currentAmount / top.targetAmount) * 100)}% funded.`)
  } else {
    lines.push(
      `Savings rate ${(metrics.savingsRate * 100).toFixed(0)}% this month on ₹${formatCurrency(metrics.monthlyIncome)} income.`
    )
  }

  return lines.slice(0, 4)
}

function buildPrompt(inputs: ReviewInputs): string {
  const { period, metrics, budgets, portfolio, runway, goals, riskProfile } = inputs

  const nonEssentialLines = budgets
    .filter((b) => !b.essential)
    .map((b) => `${b.category}: ₹${formatCurrency(b.spent_this_month)} of ₹${formatCurrency(b.monthly_limit)} limit`)
    .join("; ") || "no flexible budgets set"

  const essentialLines = budgets
    .filter((b) => b.essential)
    .map((b) => `${b.category}: ₹${formatCurrency(b.spent_this_month)} of ₹${formatCurrency(b.monthly_limit)}`)
    .join("; ") || "no essential budgets set"

  const allocationLines = portfolio.allocation
    .map((a) => `${a.category} ${a.pct.toFixed(0)}%${a.targetPct > 0 ? ` vs target ${a.targetPct.toFixed(0)}%` : ""}`)
    .join("; ") || "no holdings logged"

  const goalLines = goals
    .map((g) => `${g.name}: ${g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0}% funded`)
    .join("; ") || "no active goals"

  const emergencyOk = runway.currentBalance >= runway.safetyBufferTargetAmount

  return `You are Yogi's Wealth AI, an elite autonomous personal wealth manager for Shameek Yogi with irregular income, in India (INR). Risk profile: ${riskProfile}.

Write a monthly review for ${monthLabel(period)}. Check in this order — discipline before growth:
1. Flexible/lifestyle budget spend: ${nonEssentialLines}
2. Essential budget spend: ${essentialLines}
3. Emergency fund: balance ₹${formatCurrency(runway.currentBalance)} vs ${runway.safetyBufferTargetMonths}-month target ₹${formatCurrency(runway.safetyBufferTargetAmount)} — currently ${emergencyOk ? "met" : "below target"}
4. Runway: ${runway.runwayMonths !== null ? `${runway.runwayMonths.toFixed(1)} months` : "unknown"}, income volatility: ${runway.incomeVolatility}
5. Portfolio allocation: ${allocationLines}, net worth ₹${formatCurrency(portfolio.netWorth)}, total gain ${portfolio.totalGainPct.toFixed(1)}%
6. Goals: ${goalLines}
7. Income so far: ₹${formatCurrency(metrics.monthlyIncome)}, expenses: ₹${formatCurrency(metrics.monthlyExpense)}, savings rate: ${(metrics.savingsRate * 100).toFixed(0)}%

Write exactly 4 short bullet points (under 25 words each), no preamble, in this priority order:
1. Flexible-budget overspend if any (be direct, don't soften it) — otherwise say spending is on track
2. Emergency fund status — flag clearly if below target, regardless of risk profile
3. Portfolio allocation drift from the user's own target (only if a target is set — otherwise use net worth trend)
4. One goal or runway observation

Rules: use only the numbers given, don't invent figures. Do not recommend buying/selling specific securities — describe drift from the user's own stated targets only, in rupee or percentage-point terms. Do not claim certainty about future returns. Discipline (bullets 1-2) always comes before growth talk, even for an aggressive risk profile.`
}

function normalizeBullets(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]|\s*[0-9]+[.)]\s*/, "").trim())
    .filter(Boolean)
  return lines.slice(0, 4)
}

export async function generateMonthlyReview(period: string, forceRefresh = false) {
  const cached = await prisma.aICache
    .findUnique({ where: { insightType_period: { insightType: INSIGHT_TYPE, period } } })
    .catch(() => null)

  if (!forceRefresh && cached?.value) {
    return {
      review: JSON.parse(cached.value) as string[],
      updatedAt: cached.updatedAt.toISOString(),
      source: "cache" as const,
    }
  }

  const [metrics, budgets, portfolio, runway, goals, profile] = await Promise.all([
    getDashboardMetrics(),
    getBudgetsWithSpend(),
    getPortfolioSummary(),
    getRunwayMetrics(),
    prisma.goal.findMany({ select: { name: true, targetAmount: true, currentAmount: true } }),
    prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const inputs: ReviewInputs = { period, metrics, budgets, portfolio, runway, goals, riskProfile: profile?.risk_profile ?? "balanced" }

  let review: string[]
  try {
    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content:
          "You are Runway, a personal wealth-management assistant. Not a licensed adviser, and no output here is guaranteed correct — markets are unpredictable.",
      },
      { role: "user", content: buildPrompt(inputs) },
    ]
    const text = await callOpenRouterChat(messages)
    review = normalizeBullets(text)
    if (review.length === 0) throw new Error("Empty AI response")
  } catch {
    review = buildFallbackReview(inputs)
  }

  await prisma.aICache
    .upsert({
      where: { insightType_period: { insightType: INSIGHT_TYPE, period } },
      update: { value: JSON.stringify(review) },
      create: { insightType: INSIGHT_TYPE, period, value: JSON.stringify(review) },
    })
    .catch(() => null)

  return { review, updatedAt: new Date().toISOString(), source: "generated" as const }
}
