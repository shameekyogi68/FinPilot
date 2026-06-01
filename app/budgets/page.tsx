"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Plus, Wallet, Flame, CheckCircle, TrendingUp, Utensils, Car, ShoppingBag, Clapperboard, Receipt, Smartphone, Stethoscope, BookOpen, Plane, Package, Home, Lightbulb, ShoppingCart, Shield, Pizza, Dumbbell, CreditCard, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { toast } from "sonner"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { motion } from "framer-motion"

const defaultCategories = [
  "food", "transport", "shopping", "bills", "subscriptions",
  "entertainment", "healthcare", "education", "travel", "miscellaneous",
  "rent", "utilities", "groceries", "insurance", "dining", "gym",
]

const categoryIcons: Record<string, any> = {
  food: Utensils, transport: Car, shopping: ShoppingBag, bills: Receipt,
  subscriptions: Smartphone, entertainment: Clapperboard, healthcare: Stethoscope,
  education: BookOpen, travel: Plane, miscellaneous: Package,
  rent: Home, utilities: Lightbulb, groceries: ShoppingCart, insurance: Shield,
  dining: Pizza, gym: Dumbbell, default: CreditCard,
}

export function getCategoryIcon(cat: string) {
  const key = cat.toLowerCase()
  for (const [k, v] of Object.entries(categoryIcons)) {
    if (key.includes(k)) return v
  }
  return categoryIcons.default
}

const budgetFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  monthly_limit: z.number().min(0, { message: "Must be a positive number" }),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>
type Budget = { id: number | string; category: string; monthly_limit: number; spent_this_month: number }
type CurrentMonthExpense = { id: number | string; category: string; amount: number; date: string; note?: string | null }

function getProgressColor(pct: number) {
  if (pct > 100) return { bg: "bg-[var(--expense-bg)]", text: "text-[hsl(var(--expense))]", icon: AlertTriangle }
  if (pct >= 90) return { bg: "bg-[var(--warning-bg)]", text: "text-[hsl(var(--warning))]", icon: Flame }
  return { bg: "bg-[var(--income-bg)]", text: "text-[hsl(var(--income))]", icon: CheckCircle }
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<CurrentMonthExpense[]>([])
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null)
  const [deleteId, setDeleteId] = useState<string | number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dialogCategory, setDialogCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { category: "", monthly_limit: 0 },
  })

  useEffect(() => { loadBudgetData() }, [])

  useEffect(() => {
    if (activeBudget) { reset({ category: activeBudget.category, monthly_limit: activeBudget.monthly_limit }); return }
    reset({ category: dialogCategory || "", monthly_limit: 0 })
  }, [activeBudget, dialogCategory, reset])

  const categoryOptions = useMemo(() => {
    const cats = new Set<string>(defaultCategories)
    budgets.forEach((b) => cats.add(b.category))
    expenses.forEach((e) => cats.add(e.category))
    return Array.from(cats).sort()
  }, [budgets, expenses])

  const budgetCategories = useMemo(() => budgets.map((b) => b.category), [budgets])

  const unbudgeted = useMemo(() => {
    const grouped: Record<string, { amount: number; count: number }> = {}
    expenses.filter((e) => !budgetCategories.includes(e.category)).forEach((e) => {
      grouped[e.category] = grouped[e.category] ?? { amount: 0, count: 0 }
      grouped[e.category].amount += e.amount
      grouped[e.category].count += 1
    })
    return Object.entries(grouped).map(([category, v]) => ({ category, amount: v.amount, count: v.count }))
  }, [expenses, budgetCategories])

  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((s, b) => s + b.monthly_limit, 0)
    const totalSpent = budgets.reduce((s, b) => s + b.spent_this_month, 0)
    const overallRemaining = totalBudgeted - totalSpent
    const incomeRemaining = currentMonthIncome - totalBudgeted
    return { totalBudgeted, totalSpent, overallRemaining, incomeRemaining }
  }, [budgets, currentMonthIncome])

  async function loadBudgetData() {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/budgets")
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Unable to load budgets")
      setBudgets(payload.budgets ?? [])
      setExpenses(payload.currentMonthExpenses ?? [])
      setCurrentMonthIncome(payload.currentMonthIncome ?? 0)
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load budgets") }
    finally { setLoading(false) }
  }

  function openAddBudgetDialog(category?: string) {
    setActiveBudget(null); setDialogCategory(category ?? ""); setDialogOpen(true)
  }
  function openEditBudgetDialog(budget: Budget) {
    setActiveBudget(budget); setDialogCategory(""); setDialogOpen(true)
  }

  async function onSubmit(values: BudgetFormValues) {
    setSaving(true)
    try {
      const cat = values.category.toLowerCase().trim()
      const existing = budgets.find((b) => b.category === cat)
      const isEdit = Boolean(activeBudget) || Boolean(existing)
      const target = activeBudget ?? existing
      const method = isEdit ? "PATCH" : "POST"
      const url = isEdit ? `/api/budgets?id=${target?.id}` : "/api/budgets"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({...values, category: cat}) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Unable to save budget")
      toast.success(isEdit ? "Budget updated" : "Budget created!")
      setDialogOpen(false); setActiveBudget(null); setDialogCategory("")
      await loadBudgetData()
    } catch (err) { toast.error(err instanceof Error ? err.message : "Unable to save budget") }
    finally { setSaving(false) }
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/budgets?id=${deleteId}`, { method: "DELETE" })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Unable to delete budget")
      toast.success("Budget deleted")
      setDeleteId(null)
      setDialogOpen(false)
      setActiveBudget(null)
      await loadBudgetData()
    } catch (err) { toast.error(err instanceof Error ? err.message : "Unable to delete") }
    finally { setDeleting(false) }
  }

  const summaryCards = [
    { title: "Actual Income", value: formatCurrency(currentMonthIncome, currency), icon: TrendingUp, color: "text-[hsl(var(--income))]", bg: "bg-[var(--income-bg)]" },
    { title: "Total Budgeted", value: formatCurrency(summary.totalBudgeted, currency), icon: Wallet, color: "text-[hsl(var(--primary))]", bg: "bg-[hsl(var(--muted))]" },
    { title: "Income Available", value: formatCurrency(summary.incomeRemaining, currency), icon: CheckCircle, color: summary.incomeRemaining >= 0 ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]", bg: summary.incomeRemaining >= 0 ? "bg-[var(--income-bg)]" : "bg-[var(--expense-bg)]" },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen space-y-6">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-[22px] font-medium text-[#0F0E17] leading-tight">Budget Management</h1>
              <p className="text-[14px] text-[#8B89A0] mt-0.5">Set monthly spending limits per category</p>
            </div>
            <Button
              onClick={() => openAddBudgetDialog()}
              variant="outline"
              className="gap-1.5 h-9 px-3 rounded-[10px] border-[rgba(124,58,237,0.3)] text-[#7C3AED] text-[13px] font-medium hover:bg-[#F5F3FF] hover:border-[#7C3AED] transition-all duration-150"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Add Budget
            </Button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[10px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.15)] p-4 text-[#DC2626] text-[13px]"
            >
              <p className="font-medium">Error loading budgets</p>
              <p className="opacity-75">{error}</p>
            </motion.div>
          )}

          {/* Summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                  className="fp-card p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} strokeWidth={1.5} className="text-[#8B89A0]" aria-hidden="true" />
                    <span className="label-xs text-[#8B89A0]">{card.title}</span>
                  </div>
                  <p className="metric-value text-[#0F0E17] tabular-nums">{card.value}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Budget list items */}
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="fp-card p-5 animate-pulse">
                    <div className="h-4 w-1/2 rounded-full bg-[#F8F7FF] mb-4" />
                    <div className="h-1.5 w-full rounded-full bg-[#F8F7FF] mb-2" />
                    <div className="h-3 w-1/3 rounded-full bg-[#F8F7FF]" />
                  </div>
                ))
              : budgets.length > 0
              ? budgets.map((budget) => {
                  const spent = budget.spent_this_month
                  const limit = budget.monthly_limit
                  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0
                  const Icon = getCategoryIcon(budget.category)
                  const StatusIcon = getProgressColor(pct).icon

                  // Progress bar color
                  const barColor = pct >= 100 ? "#DC2626" : pct >= 75 ? "#D97706" : "#7C3AED"

                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                      className="fp-card p-5"
                    >
                      {/* Row 1 */}
                      <div className="flex items-center mb-3">
                        <Icon size={16} strokeWidth={1.5} className="text-[#4B4963] mr-2.5" aria-hidden="true" />
                        <span className="text-[15px] font-medium text-[#0F0E17] capitalize flex-1">{budget.category}</span>
                        <div className={`fp-chip text-[10px] ${
                          pct >= 100 ? "fp-chip-loss" : pct >= 75 ? "fp-chip-warn" : "fp-chip-gain"
                        }`}>
                          <StatusIcon size={10} aria-hidden="true" />
                          {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditBudgetDialog(budget)}
                          className="ml-2 h-7 w-7 p-0 text-[#8B89A0] hover:text-[#0F0E17] hover:bg-[#F8F7FF] rounded-[8px]"
                          aria-label={`Edit ${budget.category} budget`}
                        >
                          <Pencil size={13} strokeWidth={1.5} aria-hidden="true" />
                        </Button>
                      </div>

                      {/* Row 2: Progress bar */}
                      <div className="progress-bar mb-2">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
                          style={{ backgroundColor: barColor }}
                        />
                      </div>

                      {/* Row 3 */}
                      <p className="text-[12px] text-[#8B89A0] tabular-nums">
                        {formatCurrency(spent, currency)} spent of {formatCurrency(limit, currency)}
                        {pct >= 100
                          ? <span className="text-[#DC2626]"> — Over by {formatCurrency(spent - limit, currency)}</span>
                          : <span> — {formatCurrency(limit - spent, currency)} remaining</span>
                        }
                      </p>
                    </motion.div>
                  )
                })
              : (
                <div className="fp-card p-12 text-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
                    <rect x="10" y="20" width="44" height="30" rx="4" fill="#EDE9FE" />
                    <rect x="10" y="20" width="44" height="8" rx="4" fill="#C4B5FD" />
                    <rect x="18" y="34" width="20" height="3" rx="1.5" fill="#DDD6FE" />
                    <rect x="18" y="40" width="28" height="3" rx="1.5" fill="#DDD6FE" />
                  </svg>
                  <p className="text-[15px] font-medium text-[#0F0E17] mb-1">No budgets yet</p>
                  <p className="text-[13px] text-[#8B89A0] mb-4">Set monthly limits for categories to track spending.</p>
                  <Button onClick={() => openAddBudgetDialog()} className="rounded-[10px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white">Create First Budget</Button>
                </div>
              )}
          </div>

          {/* Unbudgeted expenses */}
          {unbudgeted.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="fp-card p-5"
            >
              <h2 className="text-[15px] font-medium text-[#0F0E17] mb-0.5">Unbudgeted Categories</h2>
              <p className="text-[12px] text-[#8B89A0] mb-4">These categories have spending but no budget set.</p>
              <div className="space-y-2">
                {unbudgeted.map((item) => {
                  const Icon = getCategoryIcon(item.category)
                  return (
                    <div key={item.category} className="flex items-center gap-3 py-2.5 border-b border-[rgba(0,0,0,0.05)] last:border-0">
                      <Icon size={14} strokeWidth={1.5} className="text-[#8B89A0] flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1">
                        <p className="text-[14px] font-medium capitalize text-[#0F0E17]">{item.category}</p>
                        <p className="text-[12px] text-[#8B89A0] tabular-nums">{formatCurrency(item.amount, currency)} · {item.count} transaction{item.count > 1 ? "s" : ""}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddBudgetDialog(item.category)}
                        className="h-7 px-3 text-[12px] text-[#7C3AED] hover:bg-[#F5F3FF] hover:text-[#6D28D9] rounded-[8px] font-medium"
                      >
                        + Budget
                      </Button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] sm:max-w-md" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)" }}>
            <DialogHeader>
              <DialogTitle className="font-jakarta font-semibold text-foreground">{activeBudget ? "Edit Budget" : "Add Budget"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Set a monthly spending limit for a category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="budget-category" className="text-sm text-muted-foreground">Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <CreatableSelect
                      id="budget-category"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select or type category..."
                      className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
                      options={categoryOptions.map(cat => ({
                        value: cat,
                        label: cat,
                        icon: "💳"
                      }))}
                    />
                  )}
                />
                {errors.category?.message && <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--destructive))]">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget-limit" className="text-sm text-muted-foreground">Monthly Limit (₹)</Label>
                <Input id="budget-limit" type="number" step="1" {...register("monthly_limit", { valueAsNumber: true })} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" placeholder="5000" />
                {errors.monthly_limit?.message && <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--destructive))]">{errors.monthly_limit.message}</p>}
              </div>
              <DialogFooter className="flex items-center sm:justify-between w-full">
                {activeBudget ? (
                  <Button type="button" variant="ghost" onClick={() => setDeleteId(activeBudget.id)} className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[var(--expense-bg)] -ml-2 mr-auto rounded-xl">
                    Delete Budget
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || saving}>
                    {activeBudget ? "Save Changes" : "Create Budget"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)]" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)" }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[16px] font-medium text-[#0F0E17]">Delete Budget</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-[#4B4963]">
                Are you sure you want to delete this budget? Your spending analytics will not be affected, but the limit will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-[10px] border-[rgba(0,0,0,0.10)] text-[#4B4963] hover:bg-[#F8F7FF]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="rounded-[10px] bg-[#DC2626] text-white hover:bg-[#b91c1c]" disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Budget"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}
