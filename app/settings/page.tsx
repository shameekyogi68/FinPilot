import { SettingsClient } from "@/components/settings/SettingsClient"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const profile = await prisma.profile.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  })

  return (
    <SettingsClient
      initialProfile={{
        name: profile.name,
        email: profile.email,
        currency: profile.currency as "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "JPY",
        monthly_income: profile.monthly_income,
        savings_target: profile.savings_target,
        theme: profile.theme as "light" | "dark",
        default_month_view: profile.default_month_view as "current" | "last",
        ai_enabled: profile.ai_enabled,
        income_averaging_months: profile.income_averaging_months,
        safety_buffer_months: profile.safety_buffer_months,
        target_equity_pct: profile.target_equity_pct,
        target_debt_pct: profile.target_debt_pct,
        target_gold_pct: profile.target_gold_pct,
        target_cash_pct: profile.target_cash_pct,
        risk_profile: profile.risk_profile as "conservative" | "balanced" | "aggressive",
        rebalance_threshold_pct: profile.rebalance_threshold_pct,
      }}
    />
  )
}
