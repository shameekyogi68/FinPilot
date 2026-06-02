"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { formatCurrency, updateCurrencyInAllAmounts } from "@/lib/utils/settings"
import ExportData from "@/components/settings/ExportData"
import DeleteData from "@/components/settings/DeleteData"
import BackupRestore from "@/components/settings/BackupRestore"
import { motion } from "framer-motion"
import {
  User, IndianRupee, SlidersHorizontal, AlertOctagon,
  Save, CheckCircle2, BrainCircuit, BarChart3
} from "lucide-react"

const currencyOptions = [
  { value: "INR", label: "₹ INR — Indian Rupee", flag: "🇮🇳" },
  { value: "USD", label: "$ USD — US Dollar", flag: "🇺🇸" },
  { value: "EUR", label: "€ EUR — Euro", flag: "🇪🇺" },
  { value: "GBP", label: "£ GBP — British Pound", flag: "🇬🇧" },
  { value: "CAD", label: "$ CAD — Canadian Dollar", flag: "🇨🇦" },
  { value: "AUD", label: "$ AUD — Australian Dollar", flag: "🇦🇺" },
  { value: "JPY", label: "¥ JPY — Japanese Yen", flag: "🇯🇵" },
] as const

type CurrencyOption = (typeof currencyOptions)[number]["value"]
type MonthView = "current" | "last"

type SettingsState = {
  name: string
  email: string
  currency: CurrencyOption
  monthlyIncome: string
  savingsTarget: string
  theme: "light" | "dark"
  monthView: MonthView
  aiEnabled: boolean
  createdAt: string
}

const initialState: SettingsState = {
  name: "Shameek Yogi",
  email: "",
  currency: "INR",
  monthlyIncome: "0",
  savingsTarget: "0",
  theme: "dark",
  monthView: "current",
  aiEnabled: true,
  createdAt: "",
}

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>(initialState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedPulse, setSavedPulse] = useState(false)

  const memberSince = useMemo(() => {
    if (!state.createdAt) return "—"
    return new Date(state.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
  }, [state.createdAt])

  const initials = useMemo(() => {
    const parts = state.name.trim().split(" ").filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return (state.name.slice(0, 2) || "FP").toUpperCase()
  }, [state.name])

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/profile")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Unable to load profile")
      setState((cur) => ({
        ...cur,
        name: String(data.name ?? cur.name),
        email: String(data.email ?? cur.email),
        currency: (data.currency as CurrencyOption) ?? cur.currency,
        monthlyIncome: String(data.monthly_income ?? cur.monthlyIncome),
        savingsTarget: String(data.savings_target ?? cur.savingsTarget),
        theme: data.theme === "light" ? "light" : "dark",
        aiEnabled: data.ai_enabled ?? cur.aiEnabled,
        createdAt: data.created_at ? String(data.created_at) : cur.createdAt,
      }))
    } catch (err) { toast.error((err as Error)?.message || "Unable to load settings") }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const monthlyIncome = Number(state.monthlyIncome || 0)
      const savingsTarget = Number(state.savingsTarget || 0)
      if (!state.name.trim()) { toast.error("Please enter your name"); return }

      const payload = {
        name: state.name.trim(), email: state.email || null, currency: state.currency,
        monthly_income: Number.isNaN(monthlyIncome) ? 0 : monthlyIncome,
        savings_target: Number.isNaN(savingsTarget) ? 0 : savingsTarget,
        theme: state.theme, default_month_view: state.monthView, ai_enabled: state.aiEnabled,
      }

      const res = await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Unable to save settings")

      updateCurrencyInAllAmounts(state.currency)
      toast.success("Settings saved successfully!")
      setSavedPulse(true)
      setTimeout(() => setSavedPulse(false), 2500)
      await fetchProfile()
    } catch (err) { toast.error((err as Error)?.message || "Unable to save settings") }
    finally { setSaving(false) }
  }

  const monthlyIncomePreview = Number(state.monthlyIncome || 0)
  const savingsTargetPreview = Number(state.savingsTarget || 0)

  return (
    <ErrorBoundary>
      <div className="min-h-screen space-y-8 max-w-3xl pb-12">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center flex-shrink-0 text-[16px] font-bold text-[#7C3AED] bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm border border-purple-200/50 select-none"
              aria-hidden="true"
            >
              {loading ? "…" : initials}
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-[#0F0E17] leading-tight tracking-tight">Account Settings</h1>
              <p className="text-[14px] text-[#8B89A0] mt-0.5 font-medium">Member since {memberSince}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="btn-primary flex items-center gap-1.5"
          >
            {savedPulse ? (
              <><CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" /> Saved!</>
            ) : saving ? (
              <><Save size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> Saving…</>
            ) : (
              <><Save size={14} strokeWidth={1.5} aria-hidden="true" /> Save Settings</>
            )}
          </button>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fp-card p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[rgba(0,0,0,0.06)]">
              <div className="section-header-icon !mb-0">
                <User size={18} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#0F0E17]">Profile</h2>
                <p className="text-[12px] text-[#8B89A0] font-medium">Your display credentials</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-name" className="label-premium">Display Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                  placeholder="Your name"
                  className="custom-input"
                />
              </div>
              <div>
                <label htmlFor="settings-email" className="label-premium">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={state.email}
                  disabled
                  placeholder="Not set"
                  className="custom-input opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
          </motion.div>

          {/* Financial Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fp-card p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[rgba(0,0,0,0.06)]">
              <div className="section-header-icon !mb-0">
                <IndianRupee size={18} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#0F0E17]">Financial Settings</h2>
                <p className="text-[12px] text-[#8B89A0] font-medium">Currency, income &amp; savings targets</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-currency" className="label-premium">Currency</label>
                <select
                  id="settings-currency"
                  value={state.currency}
                  onChange={(e) => setState({ ...state, currency: e.target.value as CurrencyOption })}
                  className="custom-input appearance-none bg-no-repeat bg-[right_16px_center]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234B4963' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e")`, backgroundSize: '16px' }}
                >
                  {currencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.flag} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="settings-income" className="label-premium">Monthly Income</label>
                <input
                  id="settings-income"
                  type="number"
                  step="1"
                  min="0"
                  value={state.monthlyIncome}
                  onChange={(e) => setState({ ...state, monthlyIncome: e.target.value })}
                  placeholder="e.g. 80000"
                  className="custom-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-savings" className="label-premium">Savings Target (Monthly)</label>
                <input
                  id="settings-savings"
                  type="number"
                  step="1"
                  min="0"
                  value={state.savingsTarget}
                  onChange={(e) => setState({ ...state, savingsTarget: e.target.value })}
                  placeholder="e.g. 20000"
                  className="custom-input"
                />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="mt-5 rounded-[12px] px-4 py-3.5 text-[13px] font-semibold text-[#7C3AED] flex items-center gap-2 bg-gradient-to-r from-purple-50 to-transparent border border-purple-100/40">
              <BarChart3 size={15} className="flex-shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{formatCurrency(monthlyIncomePreview, state.currency)} income · {formatCurrency(savingsTargetPreview, state.currency)} savings target</span>
              {monthlyIncomePreview > 0 && savingsTargetPreview > 0 && (
                <span className="text-[#8B89A0] font-medium ml-auto">
                  {((savingsTargetPreview / monthlyIncomePreview) * 100).toFixed(0)}% Savings Rate
                </span>
              )}
            </div>
          </motion.div>

          {/* Preferences Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fp-card p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[rgba(0,0,0,0.06)]">
              <div className="section-header-icon !mb-0">
                <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#0F0E17]">Preferences</h2>
                <p className="text-[12px] text-[#8B89A0] font-medium">Manage advisor features</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* AI Insights Switch */}
              <div className="flex items-center justify-between rounded-[14px] px-5 py-4 bg-gradient-to-r from-[rgba(0,0,0,0.02)] to-transparent border border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <BrainCircuit className="w-5 h-5 text-[#7C3AED]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#0F0E17]">AI Advisor Insights</p>
                    <p className="text-[12px] text-[#8B89A0] font-medium">Wealth recommendations on dashboard</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setState({ ...state, aiEnabled: !state.aiEnabled })}
                  className={`toggle-switch ${state.aiEnabled ? "active" : ""}`}
                >
                  <span className="toggle-switch-thumb" />
                </button>
              </div>

              {/* Default Month View */}
              <div className="rounded-[14px] px-5 py-4 bg-gradient-to-r from-[rgba(0,0,0,0.02)] to-transparent border border-[rgba(0,0,0,0.06)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <SlidersHorizontal className="w-5 h-5 text-[#7C3AED]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#0F0E17]">Default Month View</p>
                    <p className="text-[12px] text-[#8B89A0] font-medium">Which month to display first</p>
                  </div>
                </div>
                <select
                  value={state.monthView}
                  onChange={(e) => setState({ ...state, monthView: e.target.value as MonthView })}
                  className="custom-input appearance-none bg-no-repeat bg-[right_16px_center] !w-44"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234B4963' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e")`, backgroundSize: '16px' }}
                >
                  <option value="current">Current month</option>
                  <option value="last">Last month</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fp-card p-6 border-red-200 bg-gradient-to-br from-red-50/30 to-transparent"
          >
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-red-100">
              <div className="w-9 h-9 rounded-[10px] bg-red-50 flex items-center justify-center">
                <AlertOctagon size={18} strokeWidth={1.5} className="text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-red-700">Danger Zone</h2>
                <p className="text-[12px] text-red-500/70 font-medium">Irreversible data actions</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ExportData />
              <BackupRestore />
              <DeleteData />
            </div>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
