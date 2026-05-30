import { createSupabaseAdmin } from "@/lib/supabaseAdmin"
import { callOpenRouterChat, type OpenRouterMessage } from "@/services/ai/client"

const INSIGHT_TYPE = "monthly_summary"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const SUBSCRIPTION_KEYWORDS = ["netflix", "spotify", "subscription", "hulu", "apple music", "amazon prime"]

const monthLabel = (year: number, month: number) => {
  return `${new Date(year, month - 1, 1).toLocaleString("default", { month: "long" })} ${year}`
}

const parseMonth = (month: string) => {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(month)
  if (!match) {
    throw new Error("Month must be in YYYY-MM format")
  }

  const year = Number(match[1])
  const monthNumber = Number(match[2])

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month must be in YYYY-MM format")
  }

  return { year, month: monthNumber }
}

const formatCurrency = (value: number) => value.toFixed(2)

const normalizeInsights = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[0-9]+[.)]\s*/, "").trim())
    .filter(Boolean)

  if (lines.length >= 3) {
    return lines.slice(0, 3)
  }

  const fragments = text
    .split(/\n{2,}|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return fragments.slice(0, 3).concat(Array(3 - fragments.length).fill(""))
}

function getFallbackInsights(totalIncome: number, totalExpenses: number, topCategory: string) {
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  return [
    `Your savings rate is ${savingsRate.toFixed(1)}% this month.`,
    `${topCategory} is your highest expense category. Consider reviewing these costs.`,
    `Track your daily spending for one week to identify small leaks.`,
  ]
}

const getCategoryTotals = (transactions: Array<{ category: string; amount: number }>) => {
  return transactions.reduce<Record<string, number>>((summary, transaction) => {
    summary[transaction.category] = (summary[transaction.category] ?? 0) + transaction.amount
    return summary
  }, {})
}

const getSubscriptionExpenses = (transactions: Array<{ note?: string | null; amount: number; category: string }>) => {
  return transactions.filter((transaction) => {
    const note = transaction.note?.toLowerCase() ?? ""
    return SUBSCRIPTION_KEYWORDS.some((keyword) => note.includes(keyword))
  })
}

const getUnusualCategories = (
  currentTotals: Record<string, number>,
  previousAverage: number
) => {
  if (previousAverage <= 0) {
    return []
  }

  return Object.entries(currentTotals)
    .filter(([, amount]) => amount > previousAverage * 1.5)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => `${category} ($${formatCurrency(amount)})`)
}

const buildSavingsTips = (coffeeTotal: number, subscriptionsTotal: number) => {
  const tips: string[] = []

  if (coffeeTotal > 0) {
    tips.push(`You spent $${formatCurrency(coffeeTotal)} on coffee. Making at home saves $${formatCurrency(coffeeTotal * 0.7)}.`)
  }

  if (subscriptionsTotal > 0) {
    tips.push(`Your subscriptions total $${formatCurrency(subscriptionsTotal)}. Cancel unused ones.`)
  }

  if (tips.length === 0) {
    tips.push("Review small, recurring purchases and dining out to free up monthly savings.")
  }

  return tips
}

export async function generateMonthlyInsights(monthPeriod: string, forceRefresh = false) {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    throw new Error("Missing Supabase service configuration")
  }

  const { year, month } = parseMonth(monthPeriod)
  const period = `${year}-${String(month).padStart(2, "0")}`
  const monthName = monthLabel(year, month)
  const monthStart = new Date(year, month - 1, 1)
  const nextMonth = new Date(year, month, 1)

  const previousMonthStart = new Date(year, month - 2, 1)
  const previousMonthEnd = new Date(year, month - 1, 1)

  const { data: cached, error: cacheError } = await supabase
    .from("ai_cache")
    .select("id, value, updated_at")
    .eq("insight_type", INSIGHT_TYPE)
    .eq("period", period)
    .maybeSingle()

  if (cacheError) {
    console.warn("Unable to read AI cache", cacheError.message)
  }

  if (!forceRefresh && cached?.value && cached?.updated_at) {
    const updatedAt = new Date(cached.updated_at)
    const age = Date.now() - updatedAt.getTime()

    if (age < CACHE_TTL_MS) {
      const cachedInsights = Array.isArray(cached.value) ? cached.value : JSON.parse(String(cached.value))
      return {
        insights: cachedInsights as string[],
        updatedAt: updatedAt.toISOString(),
        source: "cache",
      }
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type, category, date, note")
    .gte("date", monthStart.toISOString())
    .lt("date", nextMonth.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  const { data: previousData, error: previousError } = await supabase
    .from("transactions")
    .select("amount, type, category, date, note")
    .gte("date", previousMonthStart.toISOString())
    .lt("date", previousMonthEnd.toISOString())

  if (previousError) {
    console.warn("Unable to read previous month transactions", previousError.message)
  }

  const transactions = data ?? []
  const previousTransactions = previousData ?? []

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const expenseTransactions = transactions.filter((transaction) => transaction.type === "expense")
  const previousExpenseTransactions = previousTransactions.filter((transaction) => transaction.type === "expense")

  const categoryTotals = getCategoryTotals(expenseTransactions)
  const previousCategoryTotals = getCategoryTotals(previousExpenseTransactions)

  const previousAverageExpense =
    Object.values(previousCategoryTotals).reduce((sum, value) => sum + value, 0) /
    Math.max(1, Object.values(previousCategoryTotals).length)

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, amount]) => `${category} ($${formatCurrency(amount)})`)

  const largestExpense = expenseTransactions.reduce((max, transaction) => {
    return transaction.amount > max.amount ? transaction : max
  }, { amount: 0, category: "No expenses", date: "" })

  const subscriptionExpenses = getSubscriptionExpenses(expenseTransactions)
  const subscriptionsTotal = subscriptionExpenses.reduce((sum, transaction) => sum + transaction.amount, 0)

  const coffeeTotal = expenseTransactions
    .filter((transaction) => transaction.note?.toLowerCase().includes("coffee"))
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const unusualCategories = getUnusualCategories(categoryTotals, previousAverageExpense)
  const subscriptionSummary = subscriptionExpenses
    .map((transaction) => transaction.category)
    .filter((value, index, self) => self.indexOf(value) === index)
    .join(", ") || "none"

  const savingsTips = buildSavingsTips(coffeeTotal, subscriptionsTotal)
  const savingsTipsSummary = savingsTips.join("; ")

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  const categories = topCategories.length > 0 ? topCategories.join(", ") : "No expenses"
  const largestExpenseDescription = largestExpense.amount
    ? `${largestExpense.category} for $${formatCurrency(largestExpense.amount)}`
    : "$0"

  const prompt = `You are a personal finance advisor analyzing my spending for ${monthName}.

My financial data:
- Income: $${formatCurrency(totalIncome)}
- Expenses: $${formatCurrency(totalExpenses)}
- Savings rate: ${formatCurrency(savingsRate)}%
- Top spending categories: ${categories}
- Largest single expense: ${largestExpenseDescription}
- Subscription spending: $${formatCurrency(subscriptionsTotal)} (${subscriptionSummary})
- Unusual categories: ${unusualCategories.length > 0 ? unusualCategories.join(", ") : "none"}
- Savings tips: ${savingsTipsSummary}

Generate exactly 3 short insights (under 20 words each):
1. One positive observation about my finances
2. One area where I could improve
3. One specific actionable recommendation

Be concise, helpful, and data-driven. Don't repeat information.`

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: "You are a helpful personal finance advisor.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]

  let insights: string[]

  try {
    const responseText = await callOpenRouterChat(messages)
    insights = normalizeInsights(responseText)
    if (insights.every((line) => line === "")) {
      throw new Error("AI returned empty insights")
    }
  } catch (error) {
    const topCategory = topCategories[0]?.split(" (")[0] ?? "your top category"
    insights = getFallbackInsights(totalIncome, totalExpenses, topCategory)
  }

  const cachePayload = {
    insight_type: INSIGHT_TYPE,
    period,
    value: insights,
  }

  if (cached?.id) {
    const { error: updateError } = await supabase
      .from("ai_cache")
      .update(cachePayload)
      .eq("id", cached.id)

    if (updateError) {
      console.warn("Unable to update AI cache", updateError.message)
    }
  } else {
    const { error: insertError } = await supabase.from("ai_cache").insert(cachePayload)
    if (insertError) {
      console.warn("Unable to insert AI cache", insertError.message)
    }
  }

  return {
    insights,
    updatedAt: new Date().toISOString(),
    source: "ai",
  }
}
