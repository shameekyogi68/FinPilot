import { prisma } from "@/lib/prisma"
import { getPortfolioSummary } from "@/lib/queries/investmentQueries"
import { getRunwayMetrics } from "@/lib/queries/runwayQueries"
import { callMultiModelAI } from "@/services/ai/multiModelClient"

export type DailyDirective = {
  id: string
  title: string
  description: string
  type: "action" | "warning" | "opportunity" | "insight"
  category: "spend" | "invest" | "buffer" | "rebalance"
  amount?: number
  actionLabel?: string
  actionUrl?: string
}

export type DailyWealthPulse = {
  dateIso: string
  safeDailySpend: number
  monthSpentSoFar: number
  monthIncomeSoFar: number
  netWorth: number
  runwayMonths: number | null
  bufferStatus: "healthy" | "building" | "critical"
  directives: DailyDirective[]
  aiOfficerSummary: string
  modelUsed?: string
}

export type MonthlyPlanWizardData = {
  projectedIncome: number
  essentialExpenses: number
  emergencyBufferAllocation: number
  targetInvestments: {
    equityMf: number
    debtMf: number
    gold: number
    stocksOrLumpsum: number
    totalInvestment: number
  }
  safeDiscretionarySpendLimit: number
  dailySpendCap: number
  actionItems: string[]
  aiStrategyNote: string
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val)

export async function getDailyWealthPulse(): Promise<DailyWealthPulse> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [transactions, budgets, portfolio, runway, profile] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: startOfMonth, lte: now } },
      select: { amount: true, type: true, category: true },
    }).catch(() => []),
    prisma.budget.findMany({ select: { category: true, monthly_limit: true, essential: true } }).catch(() => []),
    getPortfolioSummary().catch(() => null),
    getRunwayMetrics().catch(() => null),
    prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const monthIncomeSoFar = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const monthSpentSoFar = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentDay = now.getDate()
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1)

  const configuredIncome = profile?.monthly_income || 0
  const effectiveMonthlyIncome = configuredIncome > 0 ? configuredIncome : monthIncomeSoFar

  const estimatedRemainingBudget = totalMonthlyBudget > 0 
    ? Math.max(0, totalMonthlyBudget - monthSpentSoFar)
    : effectiveMonthlyIncome > 0
    ? Math.max(0, (effectiveMonthlyIncome * 0.5) - monthSpentSoFar)
    : 0

  const safeDailySpend = estimatedRemainingBudget > 0 ? Math.round(estimatedRemainingBudget / remainingDays) : 0

  // Directives generator
  const directives: DailyDirective[] = []

  // 1. Spend Directive
  if (effectiveMonthlyIncome === 0 && totalMonthlyBudget === 0) {
    directives.push({
      id: "spend-setup",
      title: "Clean Slate: Ready for August 1 Baseline",
      description: "Your ledger is completely clean. Configure your baseline monthly income in Settings or log your first August income transaction to compute your daily safe spend cap.",
      type: "action",
      category: "spend",
      amount: 0,
      actionLabel: "Configure Income in Settings",
      actionUrl: "/settings",
    })
  } else if (totalMonthlyBudget > 0 && monthSpentSoFar > totalMonthlyBudget * 0.8) {
    directives.push({
      id: "spend-warn",
      title: "Pacing Warning: Monthly Spending Near Limit",
      description: `You have spent ₹${formatCurrency(monthSpentSoFar)} out of your ₹${formatCurrency(totalMonthlyBudget)} limit. Keep today's spend below ₹${formatCurrency(safeDailySpend)}.`,
      type: "warning",
      category: "spend",
      amount: safeDailySpend,
      actionLabel: "View Budgets",
      actionUrl: "/budgets",
    })
  } else {
    directives.push({
      id: "spend-safe",
      title: `Today's Safe Spending Allowance: ₹${formatCurrency(safeDailySpend)}`,
      description: `With ${remainingDays} days remaining in the month, staying under ₹${formatCurrency(safeDailySpend)} per day protects your investment targets.`,
      type: "action",
      category: "spend",
      amount: safeDailySpend,
      actionLabel: "Log Transaction",
      actionUrl: "/transactions",
    })
  }

  // 2. Buffer & Runway Directive
  const bufferStatus = runway
    ? runway.currentBalance >= runway.safetyBufferTargetAmount
      ? "healthy"
      : runway.currentBalance >= runway.safetyBufferTargetAmount * 0.5
      ? "building"
      : "critical"
    : "building"

  if (bufferStatus !== "healthy" && runway && runway.safetyBufferTargetAmount > 0) {
    const gap = runway.safetyBufferTargetAmount - runway.currentBalance
    directives.push({
      id: "buffer-topup",
      title: "Emergency Safety Buffer Directives",
      description: `Your liquid buffer is ₹${formatCurrency(runway.currentBalance)}, which is ₹${formatCurrency(gap)} short of your ${runway.safetyBufferTargetMonths}-month goal. Direct 20% of free cash flow to high-yield savings/liquid debt MF.`,
      type: "warning",
      category: "buffer",
      amount: gap,
      actionLabel: "Analyze Safety Buffer",
      actionUrl: "/buffer-analysis",
    })
  }

  // 3. Portfolio Rebalance / Investment Directive
  if (portfolio && portfolio.allocation.some((a) => a.needsRebalance)) {
    const rebalanceItem = portfolio.allocation.find((a) => a.needsRebalance)
    directives.push({
      id: "invest-rebalance",
      title: `Portfolio Rebalance Opportunity (${rebalanceItem?.category.toUpperCase()})`,
      description: `${rebalanceItem?.category} is at ${rebalanceItem?.pct.toFixed(0)}% vs target ${rebalanceItem?.targetPct}%. Automate SIP or lumpsum transfer to realign asset allocation.`,
      type: "opportunity",
      category: "rebalance",
      actionLabel: "Rebalance Portfolio",
      actionUrl: "/investments",
    })
  } else if (!portfolio || portfolio.holdings.length === 0) {
    directives.push({
      id: "invest-setup",
      title: "Clean Portfolio Slate: Add First Holding",
      description: "No investment holdings recorded yet. Add your mutual funds, stocks, FDs, or gold on the Investments page when ready.",
      type: "action",
      category: "invest",
      actionLabel: "Add Holding",
      actionUrl: "/investments",
    })
  } else {
    directives.push({
      id: "invest-sip",
      title: "Monthly Wealth Building SIP Directive",
      description: "Consistent mutual fund investing builds compounding wealth. Deploy monthly surplus into top-rated Flexi Cap & Small Cap Mutual Funds.",
      type: "action",
      category: "invest",
      actionLabel: "Explore Mutual Funds",
      actionUrl: "/investments",
    })
  }

  // Generate AI Executive Briefing via Multi-Model Consensus Engine
  let aiOfficerSummary = ""
  let modelUsed = ""

  if (effectiveMonthlyIncome === 0 && monthSpentSoFar === 0 && (!portfolio || portfolio.holdings.length === 0)) {
    aiOfficerSummary = "Welcome Shameek Yogi. Your ledger is on a clean slate ready for August 1. Set your baseline income in Settings or log your first transaction to initiate real-time AI wealth tracking."
    modelUsed = "Slate Ready Engine"
  } else {
    try {
      const prompt = `You are Yogi's Wealth AI, an expert autonomous Personal AI Wealth Manager operating for Shameek Yogi in India (INR ₹). 
Give a concise, punchy 3-sentence daily wealth briefing for Shameek Yogi:
- Net worth: ₹${formatCurrency(portfolio?.netWorth || 0)}
- Spend this month: ₹${formatCurrency(monthSpentSoFar)} vs Income ₹${formatCurrency(monthIncomeSoFar)}
- Safe daily spend limit: ₹${formatCurrency(safeDailySpend)}
- Buffer status: ${bufferStatus}
- Risk profile: ${profile?.risk_profile || "balanced"}

Instructions: Direct Shameek Yogi clearly on what action to take today for spending and investments. Be authoritative, motivating, and luxury wealth-manager focused. Do not use generic filler.`

      const aiRes = await callMultiModelAI([
        { role: "system", content: "You are Yogi's Wealth AI, an elite autonomous wealth manager for Shameek Yogi." },
        { role: "user", content: prompt },
      ], 0.3, 200)

      aiOfficerSummary = aiRes.text
      modelUsed = aiRes.modelUsed
    } catch {
      aiOfficerSummary = safeDailySpend > 0 
        ? `Your daily safe spending allowance is capped at ₹${formatCurrency(safeDailySpend)}. Maintain your emergency buffer while routing surplus cashflow into mutual fund SIPs.`
        : "Your ledger is ready. Set your baseline monthly income in Settings to enable daily spending limits."
    }
  }

  return {
    dateIso: now.toISOString(),
    safeDailySpend,
    monthSpentSoFar,
    monthIncomeSoFar,
    netWorth: portfolio?.netWorth || 0,
    runwayMonths: runway?.runwayMonths ?? null,
    bufferStatus,
    directives,
    aiOfficerSummary,
    modelUsed,
  }
}

export async function generateMonthlyWizardPlan(customIncome?: number): Promise<MonthlyPlanWizardData> {
  const [profile, runway, budgets] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null),
    getRunwayMetrics().catch(() => null),
    prisma.budget.findMany().catch(() => []),
  ])

  const projectedIncome = customIncome || profile?.monthly_income || 100000
  const essentialExpenses = budgets
    .filter((b) => b.essential)
    .reduce((sum, b) => sum + b.monthly_limit, 0) || Math.round(projectedIncome * 0.4)

  const currentBuffer = runway?.currentBalance || 0
  const bufferTarget = runway?.safetyBufferTargetAmount || projectedIncome * 3
  const bufferGap = Math.max(0, bufferTarget - currentBuffer)

  // 10% towards emergency buffer top-up if gap exists
  const emergencyBufferAllocation = bufferGap > 0 ? Math.round(Math.min(projectedIncome * 0.15, bufferGap * 0.2)) : 0

  const remainingForInvestAndDiscretionary = projectedIncome - essentialExpenses - emergencyBufferAllocation

  // Invest 40% - 60% of remaining depending on risk profile
  const investRatio = profile?.risk_profile === "aggressive" ? 0.6 : profile?.risk_profile === "conservative" ? 0.35 : 0.5
  const totalInvestment = Math.round(Math.max(0, remainingForInvestAndDiscretionary * investRatio))

  const targetEquityPct = profile?.target_equity_pct || 60
  const targetDebtPct = profile?.target_debt_pct || 30
  const targetGoldPct = profile?.target_gold_pct || 10

  const equityMf = Math.round(totalInvestment * (targetEquityPct / 100))
  const debtMf = Math.round(totalInvestment * (targetDebtPct / 100))
  const gold = Math.round(totalInvestment * (targetGoldPct / 100))
  const stocksOrLumpsum = Math.max(0, totalInvestment - (equityMf + debtMf + gold))

  const safeDiscretionarySpendLimit = Math.round(Math.max(0, projectedIncome - essentialExpenses - emergencyBufferAllocation - totalInvestment))
  const dailySpendCap = Math.round(safeDiscretionarySpendLimit / 30)

  const actionItems = [
    `Automate ₹${formatCurrency(equityMf)} into Direct Flexi Cap & Index Mutual Funds on the 5th of every month.`,
    `Deposit ₹${formatCurrency(debtMf)} into Liquid Debt Mutual Fund / Short Term Debt to maintain liquid stability.`,
    `Limit discretionary lifestyle expenses to ₹${formatCurrency(dailySpendCap)} per day (₹${formatCurrency(safeDiscretionarySpendLimit)} total monthly).`,
    bufferGap > 0 ? `Transfer ₹${formatCurrency(emergencyBufferAllocation)} into Emergency High-Yield Buffer Account.` : `Emergency buffer is 100% funded (${runway?.safetyBufferTargetMonths || 3} months covered).`,
  ]

  let aiStrategyNote = ""
  try {
    const aiRes = await callMultiModelAI([
      {
        role: "system",
        content: "You are FinPilot, an elite wealth management strategist.",
      },
      {
        role: "user",
        content: `Income: ₹${projectedIncome}, Investments: ₹${totalInvestment}, Discretionary spend limit: ₹${safeDiscretionarySpendLimit}. Risk profile: ${profile?.risk_profile}. Provide a 2-sentence tactical wealth advice statement for this monthly plan.`,
      },
    ], 0.3, 150)
    aiStrategyNote = aiRes.text
  } catch {
    aiStrategyNote = `By committing ₹${formatCurrency(totalInvestment)} directly to wealth-building assets this month, you preserve financial runway while capping non-essential lifestyle inflation.`
  }

  return {
    projectedIncome,
    essentialExpenses,
    emergencyBufferAllocation,
    targetInvestments: {
      equityMf,
      debtMf,
      gold,
      stocksOrLumpsum,
      totalInvestment,
    },
    safeDiscretionarySpendLimit,
    dailySpendCap,
    actionItems,
    aiStrategyNote,
  }
}
