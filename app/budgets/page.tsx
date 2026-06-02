"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Plus, Wallet, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { toast } from "sonner"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { motion } from "framer-motion"
import { getCategoryEmoji } from "@/components/transactions/TransactionForm"

const defaultCategories = [
  "food", "transport", "shopping", "bills", "subscriptions",
  "entertainment", "healthcare", "education", "travel", "miscellaneous",
  "rent", "utilities", "groceries", "insurance", "dining", "gym",
]

const budgetFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  monthly_limit: z.number().min(0, { message: "Must be a positive number" }),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>
type Budget = { id: number | string; category: string; monthly_limit: number; spent_this_month: number }
type CurrentMonthExpense = { id: number | string; category: string; amount: number; date: string; note?: string | null }

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

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<BudgetFormValues>({
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

  return (
    <ErrorBoundary>
      <div className="space-y-8 min-h-screen">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between" style={{ animation: "fadeInUp 0.35s ease both" }}>
          <div>
            <h1 className="text-[26px] font-bold text-[#0F0E17] leading-tight tracking-tight">Budget Management</h1>
            <p className="text-[14px] text-[#8B89A0] mt-1 font-medium">Control monthly limits and view excess spending</p>
          </div>
          <button onClick={() => openAddBudgetDialog()} className="btn-primary">
            <Plus size={16} strokeWidth={2.5} /> Add Budget
          </button>
        </div>

        {error && (
          <div className="rounded-[10px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.15)] p-4 text-[#ef4444] text-[13px]">
            <p className="font-medium">Error loading budgets</p>
            <p className="opacity-75">{error}</p>
          </div>
        )}

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" style={{ animation: "fadeInUp 0.35s ease both", animationDelay: "0.08s" }}>
          <div className="fp-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-1">Actual Income</p>
              <p className="text-[22px] font-bold text-emerald-700 tabular-nums leading-none">
                {formatCurrency(currentMonthIncome, currency)}
              </p>
            </div>
          </div>
          <div className="fp-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-1">Total Budgeted</p>
              <p className="text-[22px] font-bold text-[#7C3AED] tabular-nums leading-none">
                {formatCurrency(summary.totalBudgeted, currency)}
              </p>
            </div>
          </div>
          <div className="fp-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-[#4B4963]" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-1">Available Balance</p>
              <p className="text-[22px] font-bold text-[#4B4963] tabular-nums leading-none">
                {formatCurrency(summary.incomeRemaining, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Cards container */}
        <div className="space-y-4" style={{ animation: "fadeInUp 0.35s ease both", animationDelay: "0.16s" }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="fp-card p-6 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#F5F3FF]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-1/3 bg-[#F5F3FF] rounded-full" />
                    <div className="h-2.5 w-1/4 bg-[#F5F3FF] rounded-full" />
                  </div>
                  <div className="h-6 w-24 bg-[#F5F3FF] rounded-full" />
                </div>
                <div className="h-2 w-full bg-[#F5F3FF] rounded-full" />
              </div>
            ))
          ) : budgets.length > 0 ? (
            budgets.map((budget, idx) => {
              const spent = budget.spent_this_month
              const limit = budget.monthly_limit
              const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
              const emoji = getCategoryEmoji(budget.category)

              // Accent color based on utilization
              const barColor = spent > limit ? "#DC2626" : pct >= 75 ? "#D97706" : "#7C3AED"

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="fp-card p-6"
                >
                  {/* Row 1: Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl select-none" aria-hidden="true">{emoji}</span>
                      <div>
                        <span className="text-[14px] font-bold text-[#0F0E17] capitalize block">
                          {budget.category}
                        </span>
                        <span className="text-[11px] font-bold text-[#8B89A0] uppercase tracking-wider">
                          {pct}% utilized
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-bold px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: `${barColor}12`,
                          color: barColor,
                        }}
                      >
                        {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditBudgetDialog(budget)}
                        className="h-8 w-8 p-0 text-[#8B89A0] hover:text-[#0F0E17] hover:bg-[rgba(0,0,0,0.04)] rounded-[10px]"
                        aria-label={`Edit ${budget.category} budget`}
                      >
                        <Pencil size={13} strokeWidth={2} />
                      </Button>
                    </div>
                  </div>

                  {/* Row 2: Progress Track */}
                  <div className="progress-track !h-2.5">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
                      style={{
                        background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                      }}
                    />
                  </div>

                  {/* Row 3: Footer details */}
                  <div className="flex justify-between mt-3">
                    <span className="text-[12px] font-bold text-[#8B89A0]">{pct}% Spent</span>
                    <span className={`text-[12px] font-bold tabular-nums ${spent > limit ? "text-red-500" : "text-[#4B4963]"}`}>
                      {spent > limit
                        ? `Over by ${formatCurrency(spent - limit, currency)}`
                        : `${formatCurrency(limit - spent, currency)} remaining`}
                    </span>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="fp-card p-12 text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
                <rect x="10" y="20" width="44" height="30" rx="4" fill="#EDE9FE" />
                <rect x="10" y="20" width="44" height="8" rx="4" fill="#C4B5FD" />
                <rect x="18" y="34" width="20" height="3" rx="1.5" fill="#DDD6FE" />
                <rect x="18" y="40" width="28" height="3" rx="1.5" fill="#DDD6FE" />
              </svg>
              <p className="text-[15px] font-medium text-[#0F0E17] mb-1">No budgets yet</p>
              <p className="text-[13px] text-[#8B89A0] mb-4">Set monthly limits for categories to track spending.</p>
              <button onClick={() => openAddBudgetDialog()} className="btn-primary mx-auto">
                Create First Budget
              </button>
            </div>
          )}
        </div>

        {/* Unbudgeted Section */}
        {unbudgeted.length > 0 && (
          <div className="fp-card p-6" style={{ animation: "fadeInUp 0.35s ease both", animationDelay: "0.24s" }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#0F0E17]">Unbudgeted Categories</h2>
                <p className="text-[12px] text-[#8B89A0] font-medium">Categories with spending but no limit set</p>
              </div>
            </div>
            <div className="space-y-1 mt-4">
              {unbudgeted.map((item) => {
                const emoji = getCategoryEmoji(item.category)
                return (
                  <div key={item.category} className="flex items-center justify-between gap-4 py-3 px-4 rounded-[12px] hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-base select-none" aria-hidden="true">{emoji}</span>
                      <span className="capitalize text-[13px] font-bold text-[#0F0E17]">{item.category}</span>
                      <span className="text-[12px] font-bold text-[#8B89A0]">{formatCurrency(item.amount, currency)} spent</span>
                    </div>
                    <button
                      onClick={() => openAddBudgetDialog(item.category)}
                      className="text-[12px] font-bold text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE] px-4 py-2 rounded-[8px] transition-colors"
                    >
                      + Add Budget
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Dialog Form */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="modal-content p-7 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F0E17]">
                    {activeBudget ? "Edit Category Budget" : "Add Category Budget"}
                  </h3>
                  <p className="text-[12px] text-[#8B89A0] font-medium">Set monthly ceiling limits</p>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
              <div>
                <Label htmlFor="budget-category" className="label-premium">Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <CreatableSelect
                      id="budget-category"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select category..."
                      options={categoryOptions.map(cat => ({
                        value: cat,
                        label: cat,
                        icon: getCategoryEmoji(cat)
                      }))}
                    />
                  )}
                />
                {errors.category?.message && (
                  <p className="text-[11px] text-[#ef4444] mt-1 font-medium">{errors.category.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="budget-limit" className="label-premium">Monthly Limit</Label>
                <div className="flex rounded-[14px] border-[1.5px] border-[rgba(0,0,0,0.10)] overflow-hidden focus-within:border-[#7C3AED] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.12)] transition-all bg-[rgba(255,255,255,0.70)]">
                  <div className="w-14 flex items-center justify-center text-[18px] font-bold text-[#8B89A0] border-r border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)] flex-shrink-0">
                    ₹
                  </div>
                  <input
                    id="budget-limit"
                    type="number"
                    step="1"
                    placeholder="5000"
                    {...register("monthly_limit", { valueAsNumber: true })}
                    className="flex-1 h-[48px] px-4 text-[16px] font-bold text-[#0F0E17] bg-transparent outline-none border-none focus:ring-0 focus:outline-none"
                  />
                </div>
                {errors.monthly_limit?.message && (
                  <p className="text-[11px] text-[#ef4444] mt-1 font-medium">{errors.monthly_limit.message}</p>
                )}
              </div>
              <DialogFooter className="flex items-center sm:justify-between w-full pt-2">
                {activeBudget ? (
                  <button
                    type="button"
                    onClick={() => setDeleteId(activeBudget.id)}
                    className="text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 text-[12px] font-bold px-4 py-2 rounded-[8px] transition-colors"
                  >
                    Delete Budget
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="btn-secondary !h-10 !px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary !h-10 !px-4"
                  >
                    {activeBudget ? "Save Changes" : "Create Budget"}
                  </button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="modal-content p-7">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[16px] font-bold text-[#0F0E17]">Delete Budget</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-[#4B4963]">
                Are you sure you want to delete this budget limit? Your transaction analytics will remain intact, but the ceiling budget limit will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="btn-secondary !h-10 !px-4 border-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="btn-primary !h-10 !px-4 bg-[#ef4444] hover:bg-[#b91c1c] text-white"
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Budget"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}
