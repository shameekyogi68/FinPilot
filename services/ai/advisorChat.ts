import { prisma } from "@/lib/prisma"
import { callOpenRouterChat, type OpenRouterMessage } from "@/services/ai/client"
import { getPortfolioSummary } from "@/lib/queries/investmentQueries"
import { getRunwayMetrics } from "@/lib/queries/runwayQueries"

type ChatHistoryItem = {
  role: "user" | "assistant"
  content: string
}

type Budget = {
  category: string
  monthly_limit: number
  essential: boolean
}

type Goal = {
  name: string
  targetAmount: number
  currentAmount: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const trimToWords = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/)
  return words.length <= maxWords ? text.trim() : words.slice(0, maxWords).join(" ")
}

const normalize = (text: string) => text.trim().toLowerCase()

const findCategoryFromQuery = (query: string, categories: Record<string, number>) => {
  const normalizedQuery = normalize(query)
  const categoryKeys = Object.keys(categories)

  const exactMatch = categoryKeys.find((category) => normalize(category) === normalizedQuery)
  if (exactMatch) {
    return exactMatch
  }

  const containsMatch = categoryKeys.find((category) => {
    const normalizedCategory = normalize(category)
    return normalizedQuery.includes(normalizedCategory) || normalizedCategory.includes(normalizedQuery)
  })
  if (containsMatch) {
    return containsMatch
  }

  const synonyms: Record<string, string[]> = {
    food: ["food", "dining", "meals", "groceries", "restaurants", "takeout"],
    transport: ["transport", "uber", "lyft", "taxi", "rideshare", "transit"],
    utilities: ["utilities", "electricity", "gas", "water", "internet"],
    shopping: ["shopping", "clothes", "retail", "mall"],
  }

  for (const [category, words] of Object.entries(synonyms)) {
    if (words.some((word) => normalizedQuery.includes(word))) {
      const match = categoryKeys.find((actual) => normalize(actual).includes(category) || category.includes(normalize(actual)))
      if (match) {
        return match
      }
    }
  }

  return undefined
}

const summarizeSpendingDiscipline = (budgets: Budget[], expenses: Record<string, number>) => {
  const nonEssential = budgets.filter((b) => !b.essential)
  if (nonEssential.length === 0) {
    return "No flexible/lifestyle budgets set — consider adding one so overspending there is visible."
  }

  const overspent = nonEssential
    .map((b) => ({ b, spent: expenses[b.category] ?? 0 }))
    .filter(({ b, spent }) => spent > b.monthly_limit)

  if (overspent.length === 0) {
    return "All flexible/lifestyle budgets are within limit this period."
  }

  return overspent
    .map(({ b, spent }) => `${b.category} over by ₹${formatCurrency(spent - b.monthly_limit)}`)
    .join("; ")
}

const summarizeBudgets = (budgets: Budget[], expenses: Record<string, number>) => {
  if (!budgets.length) {
    return "No budgets set."
  }

  const summaries = budgets.slice(0, 3).map((budget) => {
    const spent = expenses[budget.category] ?? 0
    const percent = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0

    if (budget.monthly_limit === 0) {
      return `${budget.category} has no limit.`
    }

    if (spent >= budget.monthly_limit) {
      return `${budget.category} is over budget.`
    }

    if (percent >= 90) {
      return `${budget.category} is near its limit.`
    }

    if (percent >= 75) {
      return `${budget.category} is approaching its limit.`
    }

    return `${budget.category} is on track.`
  })

  return summaries.join(" ")
}

const summarizeGoals = (goals: Goal[]) => {
  if (!goals.length) {
    return "No active savings goals."
  }

  const activeGoals = goals.filter((goal) => {
    return goal.currentAmount < goal.targetAmount
  })

  if (!activeGoals.length) {
    return "No active savings goals."
  }

  return activeGoals
    .slice(0, 3)
    .map((goal) => {
      const name = goal.name || "Goal"
      const current = goal.currentAmount
      const target = goal.targetAmount
      if (target > 0) {
        const percent = Math.min(100, Math.round((current / target) * 100))
        return `${name} is ${percent}% funded.`
      }
      return `${name} is in progress.`
    })
    .join(" ")
}

const summarizeTopCategories = (categories: Array<[string, number]>) => {
  if (!categories.length) {
    return "None"
  }

  return categories
    .slice(0, 3)
    .map(([category, amount]) => `${category} (₹${formatCurrency(amount)})`)
    .join(", ")
}

const formatBudgetDetails = (budgets: Budget[], expenses: Record<string, number>) => {
  if (!budgets.length) {
    return "No budget details available."
  }

  return budgets
    .map((budget) => {
      const spent = expenses[budget.category] ?? 0
      const remaining = budget.monthly_limit - spent
      const percent = budget.monthly_limit > 0 ? Math.round((spent / budget.monthly_limit) * 100) : 0
      return `${budget.category}: ₹${formatCurrency(spent)} of ₹${formatCurrency(budget.monthly_limit)} (${percent}%)${remaining < 0 ? ", over by ₹" + formatCurrency(Math.abs(remaining)) : ", ₹" + formatCurrency(remaining) + " remaining"}`
    })
    .join("; ")
}

const buildFallbackAdvice = (
  message: string,
  totalExpenses: number,
  monthlyIncome: number,
  categories: Record<string, number>,
  budgets: Budget[],
  topCategories: Array<[string, number]>
) => {
  const normalizedMessage = normalize(message)
  const topCategory = topCategories[0]
  const budgetMap = budgets.reduce<Record<string, Budget>>((acc, budget) => {
    acc[budget.category] = budget
    return acc
  }, {})

  const categoryKey = findCategoryFromQuery(message, categories)

  if (/spent on|how much.*spent|spent.*on/.test(normalizedMessage) && categoryKey) {
    const amount = categories[categoryKey] ?? 0
    const budget = budgetMap[categoryKey]
    if (budget) {
      const remaining = budget.monthly_limit - amount
      return `You spent ₹${formatCurrency(amount)} on ${categoryKey} this month. Your ${categoryKey} budget is ₹${formatCurrency(budget.monthly_limit)}, leaving ₹${formatCurrency(Math.max(0, remaining))} remaining${remaining < 0 ? ", so you're over by $" + formatCurrency(Math.abs(remaining)) : ""}.`
    }
    return `You spent ₹${formatCurrency(amount)} on ${categoryKey} this month.`
  }

  if (/over.*budget|overspending|over budget|on track/.test(normalizedMessage)) {
    const overBudget = budgets
      .map((budget) => {
        const spent = categories[budget.category] ?? 0
        return { budget, spent, percent: budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0 }
      })
      .filter((item) => item.spent > item.budget.monthly_limit || item.percent >= 90)

    if (!overBudget.length) {
      return "You are not currently overspending in any budget category. Keep tracking your spending and adjust if a category starts rising toward its limit."
    }

    const warnings = overBudget
      .slice(0, 2)
      .map((item) => {
        if (item.spent > item.budget.monthly_limit) {
          return `${item.budget.category} is over budget by ₹${formatCurrency(item.spent - item.budget.monthly_limit)}`
        }
        return `${item.budget.category} is near its limit at ${Math.round(item.percent)}%`
      })
      .join("; ")

    return `Yes — ${warnings}. Review those categories to avoid extra overages.`
  }

  if (/save more|saving more|save money|cut back|reduce spending/.test(normalizedMessage)) {
    if (!topCategory) {
      return "I don't have enough spending data to give a savings recommendation right now."
    }

    const secondCategory = topCategories[1]
    const suggestions = [`Try reducing ${topCategory[0]} by 10-15%`, secondCategory ? `and ${secondCategory[0]} by a similar amount` : ""].filter(Boolean).join(" and ")
    return `Your biggest expense is ${topCategory[0]} at ₹${formatCurrency(topCategory[1])}. ${suggestions}. Small changes there can usually save ₹${formatCurrency(Math.round(topCategory[1] * 0.12))} or more each month.`
  }

  if (/biggest expense|largest expense|top spending category/.test(normalizedMessage) && topCategory) {
    return `Your biggest expense category is ${topCategory[0]} at ₹${formatCurrency(topCategory[1])} this month.`
  }

  if (/summary|overview|quick summary|this month/.test(normalizedMessage)) {
    const topList = topCategories.slice(0, 2).map(([category, amount]) => `${category} (₹${formatCurrency(amount)})`).join(" and ")
    return `This month you spent ₹${formatCurrency(totalExpenses)} with ₹${formatCurrency(monthlyIncome)} in income. Your top categories are ${topList || "none"}. ${budgets.length ? "Check budget categories for specific limits and remaining amounts." : "No budgets are configured yet."}`
  }

  return ""
}

const summarizePortfolio = (portfolio: Awaited<ReturnType<typeof getPortfolioSummary>>) => {
  if (!portfolio.holdings.length) {
    return "No investment holdings logged yet."
  }

  const allocationText = portfolio.allocation
    .map((a) => `${a.category} ${a.pct.toFixed(0)}%${a.targetPct > 0 ? ` (target ${a.targetPct.toFixed(0)}%)` : ""}`)
    .join(", ")

  return `Net worth ₹${formatCurrency(portfolio.netWorth)}. Invested ₹${formatCurrency(portfolio.totalInvested)}, current value ₹${formatCurrency(portfolio.totalCurrentValue)} (${portfolio.totalGainPct >= 0 ? "+" : ""}${portfolio.totalGainPct.toFixed(1)}%). Allocation: ${allocationText}.`
}

const summarizeRunway = (runway: Awaited<ReturnType<typeof getRunwayMetrics>>) => {
  const volatilityText =
    runway.incomeVolatility === "unknown" ? "not enough history yet to judge" : runway.incomeVolatility.replace("_", " ")
  const runwayText = runway.runwayMonths !== null ? `${runway.runwayMonths.toFixed(1)} months` : "unknown (no expense history)"
  return `Avg monthly income ₹${formatCurrency(runway.avgMonthlyIncome)}, avg monthly expense ₹${formatCurrency(runway.avgMonthlyExpense)}, income volatility: ${volatilityText}. Cash runway: ${runwayText}. Essential monthly floor: ₹${formatCurrency(runway.essentialMonthlyFloor)}. Safety buffer target: ${runway.safetyBufferTargetMonths} months (₹${formatCurrency(runway.safetyBufferTargetAmount)}).`
}

export async function advisorChat(
  message: string,
  history: ChatHistoryItem[]
): Promise<string> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [transactionData, budgetData, goalsData, portfolio, runway] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
      select: { amount: true, type: true, category: true, note: true, date: true },
    }).catch(() => []),
    prisma.budget.findMany({
      select: { category: true, monthly_limit: true, essential: true },
    }).catch(() => []),
    prisma.goal.findMany({
      select: { name: true, targetAmount: true, currentAmount: true },
    }).catch(() => []),
    getPortfolioSummary().catch(() => null),
    getRunwayMetrics().catch(() => null),
  ])

  const profile = await prisma.profile.findUnique({ where: { id: 1 } }).catch(() => null)

  const monthlyIncome = transactionData
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const expenseTransactions = transactionData.filter((transaction) => transaction.type === "expense")
  const totalExpenses = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  const categories = expenseTransactions.reduce<Record<string, number>>((summary, transaction) => {
    const category = transaction.category ?? "Other"
    summary[category] = (summary[category] ?? 0) + transaction.amount
    return summary
  }, {})

  const topCategories = Object.entries(categories).sort(([, a], [, b]) => b - a)
  const topCategoriesSummary = summarizeTopCategories(topCategories)
  const budgetSummary = summarizeBudgets(budgetData, categories)
  const disciplineSummary = summarizeSpendingDiscipline(budgetData, categories)
  const goalsSummary = goalsData.length ? summarizeGoals(goalsData) : "No active savings goals."
  const budgetDetails = formatBudgetDetails(budgetData, categories)
  const riskProfile = profile?.risk_profile ?? "balanced"
  const emergencyFundOk = runway ? runway.currentBalance >= runway.safetyBufferTargetAmount : null

  const systemPrompt = `You are Runway, a personal wealth-management assistant operating in India, for a user with irregular, floating income (freelance, commissions, variable business income). You strictly use the Indian Wealth System (INR, lakhs, crores) and Indian financial context (tax-saving instruments, SIPs, FDs).

My risk profile: ${riskProfile}. ${riskProfile === "aggressive" ? "I have high risk tolerance and want growth-focused equity exposure, but only once my cash-flow and emergency fund are healthy — never at the cost of going into debt or skipping my safety buffer." : ""}

Check in this order — cash-flow discipline first, investing second:
1. Spending discipline (flexible/lifestyle budgets): ${disciplineSummary}
2. Emergency fund status: ${runway ? `${emergencyFundOk ? "at or above" : "below"} the ${runway.safetyBufferTargetMonths}-month target (balance ₹${formatCurrency(runway.currentBalance)} vs target ₹${formatCurrency(runway.safetyBufferTargetAmount)})` : "unavailable"}
3. Cash flow / runway: ${runway ? summarizeRunway(runway) : "unavailable"}
4. Investment portfolio vs. my own target allocation: ${portfolio ? summarizePortfolio(portfolio) : "unavailable"}

Other context:
- Income (last 30 days): ₹${formatCurrency(monthlyIncome)}
- Total expenses (last 30 days): ₹${formatCurrency(totalExpenses)}
- Top spending categories: ${topCategoriesSummary}
- Budget status: ${budgetSummary}
- Budget details: ${budgetDetails}
- Active savings goals: ${goalsSummary}

Rules:
- Use exact amounts from the data above. Do not invent numbers.
- If I ask about a category, give the specific category name and amount.
- If I ask about overspending, compare actual spend against budgets, and be direct about it — do not soften or sugar-coat a real overspend, but stay factual rather than judgmental.
- If a category has no budget, state that clearly.
- Remember my income is irregular month to month — favor advice framed around runway (months of buffer) and essential-vs-flexible spending over fixed "monthly budget" assumptions.
- Cash-flow discipline and emergency fund come before investment enthusiasm: if flexible budgets are over or the emergency fund is below target, lead with that before discussing allocation, regardless of risk profile.
- You are not a SEBI-registered investment adviser, and no answer here is guaranteed to be right — markets are unpredictable and you can be wrong. You can explain concepts, analyze my own numbers and allocation vs. my stated target in rupee terms, run "what if" math, and describe commonly-cited frameworks (e.g. age-based equity/debt splits) — but do not issue prescriptive buy/sell calls on specific stocks or funds, and do not claim certainty about future returns. Frame allocation discussion as analysis of my own data against my own stated targets, not as a recommendation from you. If I ask you to guarantee an outcome or act as if you replace a licensed advisor, say plainly that you can't.
- Be concise, direct, and professional.
`

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: "user", content: message },
  ]

  const fallback = buildFallbackAdvice(message, totalExpenses, monthlyIncome, categories, budgetData, topCategories)

  try {
    const responseText = await callOpenRouterChat(messages)
    return trimToWords(responseText, 120)
  } catch (error) {
    if (fallback) {
      return fallback
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Unable to generate AI response")
  }
}
