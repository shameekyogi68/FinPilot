"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  User,
  IndianRupee,
  SlidersHorizontal,
  AlertOctagon,
  Save,
  CheckCircle2,
  BrainCircuit,
  Compass,
  PieChart,
  Shield,
  Scale,
  Flame,
} from "lucide-react"
import { toast } from "sonner"
import { inr } from "@/lib/utils/format"
import ExportData from "@/components/settings/ExportData"
import BackupRestore from "@/components/settings/BackupRestore"
import DeleteData from "@/components/settings/DeleteData"

const CURRENCIES = [
  { value: "INR", label: "₹ Indian Rupee", flag: "🇮🇳" },
  { value: "USD", label: "$ US Dollar", flag: "🇺🇸" },
  { value: "EUR", label: "€ Euro", flag: "🇪🇺" },
  { value: "GBP", label: "£ British Pound", flag: "🇬🇧" },
  { value: "JPY", label: "¥ Japanese Yen", flag: "🇯🇵" },
  { value: "CAD", label: "C$ Canadian Dollar", flag: "🇨🇦" },
  { value: "AUD", label: "A$ Australian Dollar", flag: "🇦🇺" },
] as const

type Currency = (typeof CURRENCIES)[number]["value"]

type RiskProfileKey = "conservative" | "balanced" | "aggressive"

const RISK_PRESETS: Record<
  RiskProfileKey,
  { label: string; icon: React.ElementType; equity: number; debt: number; gold: number; cash: number; threshold: number; blurb: string }
> = {
  conservative: {
    label: "Conservative",
    icon: Shield,
    equity: 30,
    debt: 55,
    gold: 10,
    cash: 5,
    threshold: 5,
    blurb: "Capital preservation first — mostly debt, smaller equity slice.",
  },
  balanced: {
    label: "Balanced",
    icon: Scale,
    equity: 60,
    debt: 30,
    gold: 5,
    cash: 5,
    threshold: 5,
    blurb: "A common middle-ground split between growth and stability.",
  },
  aggressive: {
    label: "Aggressive",
    icon: Flame,
    equity: 90,
    debt: 5,
    gold: 5,
    cash: 0,
    threshold: 8,
    blurb: "Growth-heavy, higher expected volatility — a wider rebalance band since swings are expected.",
  },
}

export type Profile = {
  name: string
  email: string | null
  currency: Currency
  monthly_income: number
  savings_target: number
  theme: "light" | "dark"
  default_month_view: "current" | "last"
  ai_enabled: boolean
  income_averaging_months: number
  safety_buffer_months: number
  target_equity_pct: number
  target_debt_pct: number
  target_gold_pct: number
  target_cash_pct: number
  risk_profile: RiskProfileKey
  rebalance_threshold_pct: number
}

export function SettingsClient({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter()
  const [name, setName] = useState(initialProfile.name)
  const [email, setEmail] = useState(initialProfile.email ?? "")
  const [currency, setCurrency] = useState<Currency>(initialProfile.currency)
  const [monthlyIncome, setMonthlyIncome] = useState(String(initialProfile.monthly_income))
  const [savingsTarget, setSavingsTarget] = useState(String(initialProfile.savings_target))
  const [aiEnabled, setAiEnabled] = useState(initialProfile.ai_enabled)
  const [monthView, setMonthView] = useState<"current" | "last">(initialProfile.default_month_view)
  const [averagingMonths, setAveragingMonths] = useState(initialProfile.income_averaging_months)
  const [bufferMonths, setBufferMonths] = useState(initialProfile.safety_buffer_months)
  const [targetEquity, setTargetEquity] = useState(String(initialProfile.target_equity_pct))
  const [targetDebt, setTargetDebt] = useState(String(initialProfile.target_debt_pct))
  const [targetGold, setTargetGold] = useState(String(initialProfile.target_gold_pct))
  const [targetCash, setTargetCash] = useState(String(initialProfile.target_cash_pct))
  const [riskProfile, setRiskProfile] = useState<RiskProfileKey>(initialProfile.risk_profile)
  const [rebalanceThreshold, setRebalanceThreshold] = useState(initialProfile.rebalance_threshold_pct)
  const [saving, setSaving] = useState(false)

  const applyPreset = (key: RiskProfileKey) => {
    const preset = RISK_PRESETS[key]
    setRiskProfile(key)
    setTargetEquity(String(preset.equity))
    setTargetDebt(String(preset.debt))
    setTargetGold(String(preset.gold))
    setTargetCash(String(preset.cash))
    setRebalanceThreshold(preset.threshold)
  }
  const [savedPulse, setSavedPulse] = useState(false)

  const savingsRate =
    parseFloat(monthlyIncome) > 0
      ? (parseFloat(savingsTarget) / parseFloat(monthlyIncome)) * 100
      : 0

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "You",
          email: email.trim() || null,
          currency,
          monthly_income: parseFloat(monthlyIncome) || 0,
          savings_target: parseFloat(savingsTarget) || 0,
          theme: initialProfile.theme,
          default_month_view: monthView,
          ai_enabled: aiEnabled,
          income_averaging_months: averagingMonths,
          safety_buffer_months: bufferMonths,
          target_equity_pct: parseFloat(targetEquity) || 0,
          target_debt_pct: parseFloat(targetDebt) || 0,
          target_gold_pct: parseFloat(targetGold) || 0,
          target_cash_pct: parseFloat(targetCash) || 0,
          risk_profile: riskProfile,
          rebalance_threshold_pct: rebalanceThreshold,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to save settings")
        return
      }
      setSavedPulse(true)
      toast.success("Settings saved")
      router.refresh()
      setTimeout(() => setSavedPulse(false), 2200)
    } finally {
      setSaving(false)
    }
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black text-[18px] font-extrabold shadow-lg shadow-emerald-500/20">
            {initials || "?"}
          </div>
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-white leading-[1.1]">
              <span className="font-display italic text-gradient">Settings</span>
            </h1>
            <p className="text-[13.5px] text-slate-300 mt-1">Tune Yogi&apos;s Wealth AI to match how you work.</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {savedPulse ? (
            <>
              <CheckCircle2 size={14} strokeWidth={1.75} />
              Saved
            </>
          ) : saving ? (
            <>
              <Save size={14} strokeWidth={1.75} className="animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save size={14} strokeWidth={1.75} />
              Save changes
            </>
          )}
        </button>
      </motion.div>

      {/* Profile */}
      <Section icon={<User size={15} strokeWidth={1.75} />} title="Profile" subtitle="How you appear in Yogi's Wealth AI">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="Your name"
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@example.com"
            />
          </Field>
        </div>
      </Section>

      {/* Money */}
      <Section icon={<IndianRupee size={15} strokeWidth={1.75} />} title="Money" subtitle="Currency, income, savings target">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="field appearance-none bg-no-repeat pr-9 text-white bg-[#12151E]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e\")",
                backgroundSize: "16px",
                backgroundPosition: "right 14px center",
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#12151E] text-white">
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Baseline monthly income (optional)">
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="field tabular-nums"
              placeholder="0"
            />
          </Field>
          <Field label="Savings target (monthly)" full>
            <input
              type="number"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className="field tabular-nums"
              placeholder="0"
            />
          </Field>
        </div>

        {parseFloat(monthlyIncome) > 0 && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <IndianRupee size={16} strokeWidth={1.75} className="text-emerald-400 flex-shrink-0" />
            <p className="text-[12.5px] text-emerald-300 flex-1">
              Saving <span className="font-semibold">{inr(parseFloat(savingsTarget) || 0)}</span> from a baseline of{" "}
              <span className="font-semibold">{inr(parseFloat(monthlyIncome) || 0)}</span> — that&apos;s{" "}
              <span className="font-semibold">{savingsRate.toFixed(0)}%</span>. Since your income floats, the dashboard's
              real numbers are based on your actual trailing average, not this baseline.
            </p>
          </div>
        )}
      </Section>

      {/* Floating income */}
      <Section
        icon={<Compass size={15} strokeWidth={1.75} />}
        title="Floating income"
        subtitle="How Yogi's Wealth AI calculates your buffer and burn rate"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Average income over">
            <select
              value={averagingMonths}
              onChange={(e) => setAveragingMonths(Number(e.target.value))}
              className="field appearance-none bg-no-repeat pr-9 text-white bg-[#12151E]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e\")",
                backgroundSize: "16px",
                backgroundPosition: "right 14px center",
              }}
            >
              {[1, 2, 3, 6, 12].map((m) => (
                <option key={m} value={m} className="bg-[#12151E] text-white">Trailing {m} {m === 1 ? "month" : "months"}</option>
              ))}
            </select>
          </Field>
          <Field label="Safety buffer target">
            <select
              value={bufferMonths}
              onChange={(e) => setBufferMonths(Number(e.target.value))}
              className="field appearance-none bg-no-repeat pr-9 text-white bg-[#12151E]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e\")",
                backgroundSize: "16px",
                backgroundPosition: "right 14px center",
              }}
            >
              {[1, 2, 3, 6, 12].map((m) => (
                <option key={m} value={m} className="bg-[#12151E] text-white">{m} {m === 1 ? "month" : "months"} of expenses</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-[12px] text-slate-400 mt-3">
          Yogi&apos;s Wealth AI averages your income and expenses over the window above (skipping the current, still-incomplete month)
          to smooth out irregular pay cycles, and flags whether your balance covers your safety buffer target.
        </p>
      </Section>

      {/* Risk profile */}
      <Section
        icon={<Flame size={15} strokeWidth={1.75} />}
        title="Risk profile"
        subtitle="Common illustrative frameworks — pick one as a starting point, then edit the numbers below however you like"
      >
        <div className="grid sm:grid-cols-3 gap-3">
          {(Object.entries(RISK_PRESETS) as [RiskProfileKey, typeof RISK_PRESETS[RiskProfileKey]][]).map(([key, preset]) => {
            const Icon = preset.icon
            const active = riskProfile === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  active ? "border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10" : "border-white/10 bg-white/5 hover:border-emerald-500/40 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} strokeWidth={1.75} className={active ? "text-emerald-400" : "text-slate-400"} />
                  <span className="text-[13.5px] font-bold text-white">{preset.label}</span>
                </div>
                <p className="text-[11.5px] text-slate-400 leading-snug mb-2">{preset.blurb}</p>
                <p className="text-[11px] text-slate-300 tabular-nums">
                  {preset.equity}% equity · {preset.debt}% debt · {preset.gold}% gold
                </p>
              </button>
            )
          })}
        </div>
        <p className="text-[12px] text-slate-400 mt-4">
          This only fills in the numbers below and the rebalance threshold — it's a label for your own reference, not
          something the AI uses to decide anything on its own. No target changes anything automatically.
        </p>
      </Section>

      {/* Target allocation */}
      <Section
        icon={<PieChart size={15} strokeWidth={1.75} />}
        title="Target allocation"
        subtitle="A framework you set yourself — shown against your real holdings on the Investments page"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Equity %">
            <input type="number" value={targetEquity} onChange={(e) => setTargetEquity(e.target.value)} className="field tabular-nums" placeholder="0" />
          </Field>
          <Field label="Debt %">
            <input type="number" value={targetDebt} onChange={(e) => setTargetDebt(e.target.value)} className="field tabular-nums" placeholder="0" />
          </Field>
          <Field label="Gold %">
            <input type="number" value={targetGold} onChange={(e) => setTargetGold(e.target.value)} className="field tabular-nums" placeholder="0" />
          </Field>
          <Field label="Cash %">
            <input type="number" value={targetCash} onChange={(e) => setTargetCash(e.target.value)} className="field tabular-nums" placeholder="0" />
          </Field>
        </div>
        <Field label="Rebalance threshold (percentage points)" full>
          <input
            type="number"
            value={rebalanceThreshold}
            onChange={(e) => setRebalanceThreshold(Number(e.target.value) || 0)}
            className="field tabular-nums max-w-[160px]"
          />
        </Field>
        <p className="text-[12px] text-slate-400 mt-3">
          These are your own targets, not a recommendation from Yogi&apos;s Wealth AI — a common approach is splitting equity/debt based on
          your age and risk comfort. Leave at 0 to skip target tracking. The threshold controls how far a category has to
          drift before Investments flags it as "over/under target."
        </p>
      </Section>

      {/* Preferences */}
      <Section icon={<SlidersHorizontal size={15} strokeWidth={1.75} />} title="Preferences" subtitle="AI insights and defaults">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BrainCircuit size={15} strokeWidth={1.75} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-white">AI advisor insights</p>
              <p className="text-[12px] text-slate-400">Personalized signals on the dashboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAiEnabled((v) => !v)}
            className={`toggle ${aiEnabled ? "on" : ""}`}
            aria-pressed={aiEnabled}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 mt-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <SlidersHorizontal size={15} strokeWidth={1.75} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-white">Default month</p>
              <p className="text-[12px] text-slate-400">Which month loads first</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(["current", "last"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonthView(m)}
                className={`h-7 px-3 text-[12px] font-semibold rounded-lg transition-all ${
                  monthView === m ? "bg-emerald-500 text-black shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "current" ? "This month" : "Last month"}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <Section
        icon={<AlertOctagon size={15} strokeWidth={1.75} className="text-rose-400" />}
        title="Data"
        subtitle="Export, backup, or reset"
        tone="danger"
      >
        <div className="flex flex-wrap gap-3">
          <ExportData />
          <BackupRestore />
          <DeleteData />
        </div>
      </Section>
    </form>
  )
}

function Section({
  icon,
  title,
  subtitle,
  tone = "default",
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  tone?: "default" | "danger"
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="surface-card p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            tone === "danger" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-white/5 border-white/10 text-emerald-400"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-[15.5px] font-bold text-white">{title}</h2>
          {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  )
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="section-title block mb-2 text-slate-400 font-semibold">{label}</label>
      {children}
    </div>
  )
}
