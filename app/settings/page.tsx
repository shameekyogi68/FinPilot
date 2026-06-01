"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
      <div className="min-h-screen space-y-6 max-w-3xl">

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
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-semibold text-[#6D28D9] select-none"
                style={{ background: "#EDE9FE" }}
                aria-hidden="true"
              >
                {loading ? "…" : initials}
              </div>
              <div>
                <h1 className="text-[22px] font-medium text-[#fafafa] leading-tight">Account Settings</h1>
                <p className="text-[14px] text-[#a1a1aa] mt-0.5">Member since {memberSince}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:opacity-50 ${
                savedPulse
                  ? "bg-[#ECFDF5] text-[#065F46] border border-[rgba(5,150,105,0.2)]"
                  : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] active:scale-[0.99]"
              }`}
            >
              {savedPulse ? (
                <><CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" /> Saved!′</>
              ) : saving ? (
                <><Save size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> Saving…</>
              ) : (
                <><Save size={14} strokeWidth={1.5} aria-hidden="true" /> Save Settings</>
              )}
            </button>
          </motion.div>

          {/* Profile section */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <User size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
              <div>
                <h2 className="text-[15px] font-medium text-[#fafafa]">Profile</h2>
                <p className="text-[12px] text-[#a1a1aa] mt-0.5">Your name and account details</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="settings-name" className="block text-[12px] font-medium text-[#e4e4e7]">Display Name</label>
                <Input id="settings-name" value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-email" className="block text-[12px] font-medium text-[#e4e4e7]">Email</label>
                <Input id="settings-email" value={state.email} readOnly className="opacity-60 cursor-default" placeholder="Not set" />
              </div>
            </div>
          </motion.div>

          {/* Financial settings */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <IndianRupee size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
              <div>
                <h2 className="text-[15px] font-medium text-[#fafafa]">Financial Settings</h2>
                <p className="text-[12px] text-[#a1a1aa] mt-0.5">Currency, income &amp; savings targets</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="settings-currency" className="block text-[12px] font-medium text-[#e4e4e7]">Currency</label>
                <Select value={state.currency} onValueChange={(v) => setState({ ...state, currency: v as CurrencyOption })}>
                  <SelectTrigger id="settings-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.flag} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-income" className="block text-[12px] font-medium text-[#e4e4e7]">Monthly Income</label>
                <Input id="settings-income" type="number" step="1" min="0" value={state.monthlyIncome} onChange={(e) => setState({ ...state, monthlyIncome: e.target.value })} placeholder="e.g. 80000" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="settings-savings" className="block text-[12px] font-medium text-[#e4e4e7]">Savings Target (Monthly)</label>
                <Input id="settings-savings" type="number" step="1" min="0" value={state.savingsTarget} onChange={(e) => setState({ ...state, savingsTarget: e.target.value })} placeholder="e.g. 20000" />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 rounded-[10px] px-4 py-3 text-[13px] font-medium text-[#7C3AED] flex items-center gap-2" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(196,181,253,0.5)" }}>
              <BarChart3 size={14} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{formatCurrency(monthlyIncomePreview, state.currency)} income · {formatCurrency(savingsTargetPreview, state.currency)} savings target</span>
              {monthlyIncomePreview > 0 && savingsTargetPreview > 0 && (
                <span className="text-[#a1a1aa] font-normal">
                  ({((savingsTargetPreview / monthlyIncomePreview) * 100).toFixed(0)}% rate)
                </span>
              )}
            </div>
          </motion.div>

          {/* Preferences with toggles */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <SlidersHorizontal size={15} strokeWidth={1.5} className="text-[#e4e4e7]" aria-hidden="true" />
              <div>
                <h2 className="text-[15px] font-medium text-[#fafafa]">Preferences</h2>
                <p className="text-[12px] text-[#a1a1aa] mt-0.5">Month view &amp; AI features</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* AI Insights */}
              <div className="flex items-center justify-between rounded-[10px] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3">
                  <BrainCircuit size={16} strokeWidth={1.5} className="text-[#7C3AED]" aria-hidden="true" />
                  <div>
                    <p className="text-[14px] font-medium text-[#fafafa]">AI Insights</p>
                    <p className="text-[12px] text-[#a1a1aa]">Powered by Gemini · Free forever</p>
                  </div>
                </div>
                <Switch
                  checked={state.aiEnabled}
                  onCheckedChange={(checked) => setState({ ...state, aiEnabled: checked })}
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>

              {/* Month view */}
              <div className="rounded-[10px] px-4 py-3.5 space-y-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                <label className="block text-[12px] font-medium text-[#e4e4e7]">Default Month View</label>
                <Select value={state.monthView} onValueChange={(v) => setState({ ...state, monthView: v as MonthView })}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current month</SelectItem>
                    <SelectItem value="last">Last month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[rgba(220,38,38,0.12)]">
              <AlertOctagon size={15} strokeWidth={1.5} className="text-[#ef4444]" aria-hidden="true" />
              <div>
                <h2 className="text-[15px] font-medium text-[#ef4444]">Danger Zone</h2>
                <p className="text-[12px] text-[#a1a1aa] mt-0.5">Export or permanently delete your data</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ExportData />
              <BackupRestore />
            </div>
            <div className="mt-3">
              <DeleteData />
            </div>
          </motion.div>
      </div>
    </ErrorBoundary>
  )
}
