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
import { Sparkles } from "lucide-react"

const defaultCategories = [
  "food", "transport", "shopping", "bills", "subscriptions",
  "entertainment", "healthcare", "education", "travel", "miscellaneous",
  "rent", "utilities", "groceries", "insurance", "dining", "gym",
]

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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
  monthly_limit: z
    .preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number())
    .refine((v) => !Number.isNaN(v), { message: "Monthly limit is required" })
    .refine((v) => v >= 0, { message: "Must be a positive number" }),
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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Budgets</span>
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Budget <span className="text-[hsl(var(--primary))]">management</span>
              </h1>
            </div>
            <Button
              onClick={() => openAddBudgetDialog()}
              className="gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Add Budget
            </Button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[hsl(var(--muted))] rounded-xl p-5 text-[hsl(var(--destructive))] text-sm"
            >
              <p className="font-semibold">Error loading budgets</p>
              <p>{error}</p>
            </motion.div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">{card.title}</p>
                  </div>
                  <p className="font-sora text-lg font-semibold text-foreground">{card.value}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Budget cards with circular progress */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 h-56 animate-pulse">
                    <div className="h-4 w-1/2 rounded bg-[hsl(var(--border))] mb-4" />
                    <div className="h-8 w-2/3 rounded bg-[hsl(var(--border))] mb-6" />
                    <div className="h-2.5 w-full rounded-full bg-[hsl(var(--border))]" />
                  </div>
                ))
              : budgets.length > 0
              ? budgets.map((budget) => {
                  const spent = budget.spent_this_month
                  const limit = budget.monthly_limit
                  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0
                  const colorConfig = getProgressColor(pct)
                  const Icon = getCategoryIcon(budget.category)
                  const StatusIcon = colorConfig.icon
                  const circumference = 2 * Math.PI * 40
                  const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference

                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[hsl(var(--primary))]" />
                          </div>
                          <div>
                            <h3 className="font-jakarta font-semibold capitalize text-base text-foreground">{budget.category}</h3>
                            <p className="text-xs text-muted-foreground">Limit: {formatCurrency(limit, currency)}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold ${
                          pct > 100 ? "bg-[var(--expense-bg)] text-[hsl(var(--expense))]" : pct >= 90 ? "bg-[var(--warning-bg)] text-[hsl(var(--warning))]" : "bg-[var(--income-bg)] text-[hsl(var(--income))]"
                        }`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {pct > 100 ? "Over" : pct >= 90 ? "Warning" : "On Track"}
                        </div>
                      </div>

                      {/* Circular Progress */}
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-[hsl(var(--border))]"
                            />
                            <motion.circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className={colorConfig.text}
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              style={{ strokeDasharray: circumference }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-xl font-semibold ${colorConfig.text} font-sora`}>{pct}%</span>
                            <span className="text-xs text-muted-foreground">used</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-4">
                        <span className="text-muted-foreground">Spent: {formatCurrency(spent, currency)}</span>
                        <span className={pct > 100 ? "text-[hsl(var(--expense))] font-semibold" : "text-muted-foreground"}>
                          {pct > 100 ? `Over by ${formatCurrency(spent - limit, currency)}` : `${formatCurrency(limit - spent, currency)} left`}
                        </span>
                      </div>

                      {/* Quick Adjust */}
                      <div className="flex items-center gap-2 mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditBudgetDialog({ ...budget, monthly_limit: budget.monthly_limit + 500 })}
                          className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] rounded-xl"
                        >
                          +₹500
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditBudgetDialog({ ...budget, monthly_limit: Math.max(0, budget.monthly_limit - 500) })}
                          className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] rounded-xl"
                        >
                          -₹500
                        </Button>
                      </div>

                      <div className="mt-auto flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEditBudgetDialog(budget)} className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] rounded-xl">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </div>
                    </motion.div>
                  )
                })
              : (
                <div className="col-span-3 bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-12 text-center border-dashed border-[hsl(var(--border-strong))]">
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-jakarta font-semibold text-lg mb-2 text-foreground">No budgets yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Set monthly limits for categories to track your spending.</p>
                  <Button onClick={() => openAddBudgetDialog()} className="rounded-xl">Create First Budget</Button>
                </div>
              )}
          </div>

          {/* Unbudgeted expenses */}
          {unbudgeted.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6"
            >
              <h3 className="font-jakarta font-semibold text-base mb-1 text-foreground">Uncategorized Expenses</h3>
              <p className="text-xs text-muted-foreground mb-4">These categories have spending but no budget set.</p>
              <div className="space-y-2">
                {unbudgeted.map((item) => {
                  const Icon = getCategoryIcon(item.category)
                  return (
                    <div key={item.category} className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--border))] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold capitalize text-foreground">{item.category}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.amount, currency)} across {item.count} expense{item.count > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openAddBudgetDialog(item.category)} className="text-xs h-8 text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--border))] rounded-xl">
                        + Budget
                      </Button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] sm:max-w-md">
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
          <AlertDialogContent className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-jakarta font-semibold text-foreground">Delete Budget</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete this budget? Your spending analytics will not be affected, but the limit will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-muted-foreground hover:text-foreground rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90 rounded-xl" disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Budget"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}
