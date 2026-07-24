import { PrismaClient } from "@prisma/client"
import { existsSync, readFileSync } from "node:fs"

for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const equalsIndex = trimmed.indexOf("=")
    if (equalsIndex === -1) continue
    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] ??= value
  }
}

const prisma = new PrismaClient()

async function main() {
  console.log("Cleaning database for Shameek Yogi fresh start...")

  await prisma.transaction.deleteMany()
  console.log("Deleted all transactions")

  await prisma.investment.deleteMany()
  console.log("Deleted all investments")

  await prisma.budget.deleteMany()
  console.log("Deleted all budgets")

  await prisma.goal.deleteMany()
  console.log("Deleted all goals")

  await prisma.category.deleteMany()
  console.log("Deleted all categories")

  await prisma.aICache.deleteMany()
  console.log("Deleted all AI cache")

  await prisma.profile.upsert({
    where: { id: 1 },
    update: {
      name: "Shameek Yogi",
      monthly_income: 0,
      savings_target: 0,
      default_month_view: "current",
      ai_enabled: true,
      income_averaging_months: 3,
      safety_buffer_months: 3,
      target_equity_pct: 0,
      target_debt_pct: 0,
      target_gold_pct: 0,
      target_cash_pct: 0,
      risk_profile: "balanced",
      rebalance_threshold_pct: 5,
    },
    create: {
      id: 1,
      name: "Shameek Yogi",
      monthly_income: 0,
      savings_target: 0,
      currency: "INR",
      theme: "dark",
      default_month_view: "current",
      ai_enabled: true,
      income_averaging_months: 3,
      safety_buffer_months: 3,
      target_equity_pct: 0,
      target_debt_pct: 0,
      target_gold_pct: 0,
      target_cash_pct: 0,
      risk_profile: "balanced",
      rebalance_threshold_pct: 5,
    },
  })
  console.log("Reset Profile for Shameek Yogi")

  console.log("Database successfully cleaned for fresh start!")
}

main()
  .catch((e) => {
    console.error("Clean failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
