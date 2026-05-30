"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Toaster } from "@/components/ui/sonner"
import { formatCurrency, updateCurrencyInAllAmounts } from "@/lib/utils/settings"
import ExportData from '@/components/settings/ExportData'
import DeleteData from '@/components/settings/DeleteData'

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
  { value: "CAD", label: "CAD ($)" },
  { value: "AUD", label: "AUD ($)" },
  { value: "JPY", label: "JPY (¥)" },
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
  currency: "USD",
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")

  const memberSince = useMemo(() => {
    if (!state.createdAt) return "-"
    return new Date(state.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [state.createdAt])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/settings/profile")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to load profile")
      }

      setState((current) => ({
        ...current,
        name: String(data.name ?? current.name),
        email: String(data.email ?? current.email),
        currency: (data.currency as CurrencyOption) ?? current.currency,
        monthlyIncome: String(data.monthly_income ?? current.monthlyIncome),
        savingsTarget: String(data.savings_target ?? current.savingsTarget),
        theme: data.theme === "light" ? "light" : "dark",
        aiEnabled: data.ai_enabled ?? current.aiEnabled,
        createdAt: data.created_at ? String(data.created_at) : current.createdAt,
      }))
    } catch (error) {
      console.error(error)
      toast.error((error as Error)?.message || "Unable to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const monthlyIncome = Number(state.monthlyIncome || 0)
      const savingsTarget = Number(state.savingsTarget || 0)

      if (!state.name.trim()) {
        toast.error("Please enter a display name")
        return
      }

      const payload = {
        name: state.name.trim(),
        email: state.email || null,
        currency: state.currency,
        monthly_income: Number.isNaN(monthlyIncome) ? 0 : monthlyIncome,
        savings_target: Number.isNaN(savingsTarget) ? 0 : savingsTarget,
        theme: state.theme,
        default_month_view: state.monthView,
        ai_enabled: state.aiEnabled,
      }

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Unable to save settings")
      }

      updateCurrencyInAllAmounts(state.currency)
      toast.success("Settings saved")
      await fetchProfile()
    } catch (error) {
      console.error(error)
      toast.error((error as Error)?.message || "Unable to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/settings/export")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to export data")
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `finpilot-export-${now}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success("Export ready")
    } catch (error) {
      console.error(error)
      toast.error((error as Error)?.message || "Unable to export data")
    }
  }

  const handleDeleteAll = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm')
      return
    }

    try {
      const response = await fetch("/api/settings/delete", {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Unable to delete transactions")
      }

      toast.success("All transactions deleted")
      setDeleteConfirm("")
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error((error as Error)?.message || "Unable to delete transactions")
    }
  }

  const monthlyIncomePreview = Number(state.monthlyIncome || 0)
  const savingsTargetPreview = Number(state.savingsTarget || 0)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 py-10 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Settings</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Account & financial preferences</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Update your profile, financial targets, and app preferences from one place.
              </p>
            </div>
              <ThemeToggle />
            </div>
        </header>

        <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your name, email, and account creation details.</CardDescription>
              </div>
              <CardAction>
                <Button onClick={handleSave} disabled={loading || saving}>
                  Save
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={state.name}
                    onChange={(event) => setState({ ...state, name: event.target.value })}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" value={state.email} readOnly />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Member since</Label>
                  <div className="rounded-lg border border-input bg-muted p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {memberSince}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Financial Settings</CardTitle>
                <CardDescription>Choose your currency and update monthly planning goals.</CardDescription>
              </div>
              <CardAction>
                <Button onClick={handleSave} disabled={loading || saving}>
                  Save
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={state.currency}
                    onValueChange={(value) => setState({ ...state, currency: value as CurrencyOption })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Monthly income</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.monthlyIncome}
                    onChange={(event) => setState({ ...state, monthlyIncome: event.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="savingsTarget">Savings target</Label>
                <Input
                  id="savingsTarget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={state.savingsTarget}
                  onChange={(event) => setState({ ...state, savingsTarget: event.target.value })}
                  placeholder="Optional target"
                />
              </div>
              <div className="rounded-lg border border-dashed border-input bg-muted p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Preview: {formatCurrency(monthlyIncomePreview, state.currency)} income, target {formatCurrency(savingsTargetPreview, state.currency)}.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Configure theme, month view, and AI insights.</CardDescription>
            </div>
            <CardAction>
              <Button onClick={handleSave} disabled={loading || saving}>
                Save
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 rounded-xl border border-input bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Dark mode</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle theme when global theme support is enabled.</p>
                  </div>
                  <Switch
                    checked={state.theme === "dark"}
                    onCheckedChange={(checked) => setState({ ...state, theme: checked ? "dark" : "light" })}
                  />
                </div>
              </div>
              <div className="grid gap-2 rounded-xl border border-input bg-background p-4">
                <Label htmlFor="defaultMonthView">Default month view</Label>
                <Select
                  value={state.monthView}
                  onValueChange={(value) => setState({ ...state, monthView: value as MonthView })}
                >
                  <SelectTrigger id="defaultMonthView">
                    <SelectValue placeholder="Choose view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current month</SelectItem>
                    <SelectItem value="last">Last month</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 dark:text-slate-400">This setting determines the default month shown in the dashboard.</p>
              </div>
            </div>
            <div className="grid gap-2 rounded-xl border border-input bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">AI insights</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enable or disable AI-powered recommendations.</p>
                </div>
                <Switch
                  checked={state.aiEnabled}
                  onCheckedChange={(checked) => setState({ ...state, aiEnabled: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Export or remove data. Use caution when deleting all transactions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ExportData />
            <DeleteData />
          </CardContent>
        </Card>
      </div>
      <Toaster />
      </div>
    </ErrorBoundary>
  )
}
