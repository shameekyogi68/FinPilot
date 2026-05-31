"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatCurrency, updateCurrencyInAllAmounts } from "@/lib/utils/settings"
import ExportData from "@/components/settings/ExportData"
import DeleteData from "@/components/settings/DeleteData"
import { motion } from "framer-motion"
import {
  User, IndianRupee, SlidersHorizontal, AlertOctagon,
  Save, CheckCircle2, Sparkles, BrainCircuit, BarChart3
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
  name: "You",
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

  const sections = [
    {
      id: "profile",
      title: "Profile",
      desc: "Your name and account details",
      icon: User,
      iconColor: "text-[#8B5CF6]",
      iconBg: "bg-[#8B5CF6]/15",
    },
    {
      id: "financial",
      title: "Financial Settings",
      desc: "Currency, income & savings targets",
      icon: IndianRupee,
      iconColor: "text-[#D4AF37]",
      iconBg: "bg-[#D4AF37]/15",
    },
    {
      id: "preferences",
      title: "Preferences",
      desc: "Theme, month view & AI features",
      icon: SlidersHorizontal,
      iconColor: "text-[#8B5CF6]",
      iconBg: "bg-[#8B5CF6]/15",
    },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))] text-xl font-semibold flex-shrink-0">
              {loading ? "…" : initials}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Settings</span>
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Account <span className="text-[hsl(var(--primary))]">Preferences</span>
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mt-0.5">Member since {memberSince}</p>
            </div>
            <div className="ml-auto">
              <Button
                onClick={handleSave}
                disabled={loading || saving}
                className={`gap-2 rounded-xl ${savedPulse ? "bg-[hsl(var(--income))]" : ""}`}
              >
                {savedPulse ? (
                  <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                ) : saving ? (
                  <><Save className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" /> Save All</>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Profile section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                <User className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h2 className="font-jakarta font-semibold text-base text-foreground">Profile</h2>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Your name and account details</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name" className="text-sm font-medium text-muted-foreground">Display Name</Label>
                <Input id="settings-name" value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} placeholder="Your name" className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-email" className="text-sm font-medium text-muted-foreground">Email</Label>
                <Input id="settings-email" value={state.email} readOnly className="bg-[hsl(var(--muted))] border-[hsl(var(--border))] opacity-60 cursor-default" placeholder="Not set" />
              </div>
            </div>
          </motion.div>

          {/* Financial settings */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h2 className="font-jakarta font-semibold text-base text-foreground">Financial Settings</h2>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Currency, income & savings targets</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-currency" className="text-sm font-medium text-muted-foreground">Currency</Label>
                <Select value={state.currency} onValueChange={(v) => setState({ ...state, currency: v as CurrencyOption })}>
                  <SelectTrigger id="settings-currency" className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-[hsl(var(--border))]">
                    {currencyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.flag} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-income" className="text-sm font-medium text-muted-foreground">Monthly Income</Label>
                <Input id="settings-income" type="number" step="1" min="0" value={state.monthlyIncome} onChange={(e) => setState({ ...state, monthlyIncome: e.target.value })} placeholder="e.g. 80000" className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="settings-savings" className="text-sm font-medium text-muted-foreground">Savings Target (Monthly)</Label>
                <Input id="settings-savings" type="number" step="1" min="0" value={state.savingsTarget} onChange={(e) => setState({ ...state, savingsTarget: e.target.value })} placeholder="e.g. 20000" className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 rounded-xl bg-[hsl(var(--muted))] border-[hsl(var(--border))] px-4 py-3 text-[10px] font-semibold tracking-[0.1em] text-[hsl(var(--primary))]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Preview: {formatCurrency(monthlyIncomePreview, state.currency)} monthly income · Target {formatCurrency(savingsTargetPreview, state.currency)} in savings</span>
              </div>
              {monthlyIncomePreview > 0 && savingsTargetPreview > 0 && (
                <span className="ml-2 opacity-70">
                  ({((savingsTargetPreview / monthlyIncomePreview) * 100).toFixed(0)}% savings rate goal)
                </span>
              )}
            </div>
          </motion.div>

          {/* Preferences with toggles */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h2 className="font-jakarta font-semibold text-base text-foreground">Preferences</h2>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Month view & AI features</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* AI Insights */}
              <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] border-[hsl(var(--border))] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">AI Insights</p>
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Powered by Gemini · Free forever</p>
                  </div>
                </div>
                <Switch
                  checked={state.aiEnabled}
                  onCheckedChange={(checked) => setState({ ...state, aiEnabled: checked })}
                  className="data-[state=checked]:bg-[hsl(var(--primary))]"
                />
              </div>

              {/* Month view */}
              <div className="rounded-xl bg-[hsl(var(--muted))] border-[hsl(var(--border))] px-4 py-4 space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Default Month View</Label>
                <Select value={state.monthView} onValueChange={(v) => setState({ ...state, monthView: v as MonthView })}>
                  <SelectTrigger className="bg-[hsl(var(--muted))] border-[hsl(var(--border))] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-[hsl(var(--border))]">
                    <SelectItem value="current">Current month</SelectItem>
                    <SelectItem value="last">Last month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[var(--expense-bg)] flex items-center justify-center">
                <AlertOctagon className="w-5 h-5 text-[hsl(var(--destructive))]" />
              </div>
              <div>
                <h2 className="font-jakarta font-semibold text-base text-[hsl(var(--destructive))]">Danger Zone</h2>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Export or permanently delete your data</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ExportData />
              <DeleteData />
            </div>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
