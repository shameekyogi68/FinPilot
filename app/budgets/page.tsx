"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertTriangle, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster, toast } from "sonner"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { ThemeToggle } from "@/components/ThemeToggle"
import { BudgetSkeleton } from "@/components/skeletons/BudgetSkeleton"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const defaultCategories = [
  "food",
  "transport",
  "shopping",
  "bills",
  "subscriptions",
  "entertainment",
  "healthcare",
  "education",
  "travel",
  "miscellaneous",
]

const budgetFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  monthly_limit: z
    .preprocess((value) => (typeof value === "string" ? Number(value) : value), z.number())
    .refine((value) => !Number.isNaN(value), { message: "Monthly limit is required" })
    .refine((value) => value >= 0, { message: "Monthly limit must be a positive number" }),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>

type Budget = {
  id: number | string
  category: string
  monthly_limit: number
  spent_this_month: number
}

type CurrentMonthExpense = {
  id: number | string
  category: string
  amount: number
  date: string
  note?: string | null
}

function getProgressColor(percent: number) {
  if (percent > 100) return "bg-destructive"
  if (percent >= 90) return "bg-destructive"
  if (percent >= 70) return "bg-amber-500"
  return "bg-emerald-500"
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<CurrentMonthExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null)
  const [dialogCategory, setDialogCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const { profile } = useProfile()
  const currency = profile?.currency ?? "USD"

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema) as any,
    defaultValues: {
      category: "",
      monthly_limit: 0,
    },
  })

  useEffect(() => {
    loadBudgetData()
  }, [])

  useEffect(() => {
    if (activeBudget) {
      reset({ category: activeBudget.category, monthly_limit: activeBudget.monthly_limit })
      return
    }

    reset({ category: dialogCategory || "", monthly_limit: 0 })
  }, [activeBudget, dialogCategory, reset])

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>(defaultCategories)
    budgets.forEach((budget) => categories.add(budget.category))
    expenses.forEach((expense) => categories.add(expense.category))
    return Array.from(categories).sort()
  }, [budgets, expenses])

  const budgetCategories = useMemo(() => budgets.map((budget) => budget.category), [budgets])

  const unbudgetedExpensesByCategory = useMemo(() => {
    const grouped: Record<string, { amount: number; count: number }> = {}

    expenses
      .filter((expense) => !budgetCategories.includes(expense.category))
      .forEach((expense) => {
        grouped[expense.category] = grouped[expense.category] ?? { amount: 0, count: 0 }
        grouped[expense.category].amount += expense.amount
        grouped[expense.category].count += 1
      })

    return Object.entries(grouped).map(([category, values]) => ({
      category,
      amount: values.amount,
      count: values.count,
    }))
  }, [expenses, budgetCategories])

  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.monthly_limit, 0)
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent_this_month, 0)
    const overallRemaining = totalBudgeted - totalSpent
    const overBudgetCategory = budgets
      .filter((budget) => budget.spent_this_month > budget.monthly_limit)
      .sort((a, b) => b.spent_this_month / b.monthly_limit - a.spent_this_month / a.monthly_limit)[0] ?? null

    return { totalBudgeted, totalSpent, overallRemaining, overBudgetCategory }
  }, [budgets])

  async function loadBudgetData() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/budgets")
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load budgets")
      }

      setBudgets(payload.budgets ?? [])
      setExpenses(payload.currentMonthExpenses ?? [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load budgets")
    } finally {
      setLoading(false)
    }
  }

  function openAddBudgetDialog(category?: string) {
    setActiveBudget(null)
    setDialogCategory(category ?? "")
    setDialogOpen(true)
  }

  function openEditBudgetDialog(budget: Budget) {
    setActiveBudget(budget)
    setDialogCategory("")
    setDialogOpen(true)
  }

  async function onSubmit(values: BudgetFormValues) {
    setSaving(true)
    try {
      const existingBudget = budgets.find((item) => item.category === values.category)
      const isEdit = Boolean(activeBudget) || Boolean(existingBudget)
      const targetBudget = activeBudget ?? existingBudget
      const method = isEdit ? "PATCH" : "POST"
      const url = isEdit ? `/api/budgets?id=${targetBudget?.id}` : "/api/budgets"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json.error || "Unable to save budget")
      }

      toast.success(isEdit ? "Budget updated" : "Budget created")
      setDialogOpen(false)
      setActiveBudget(null)
      setDialogCategory("")
      await loadBudgetData()
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save budget")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 py-10 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Budgets</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Budget management</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Define monthly limits, monitor spending, and create budgets for categories that need them.
              </p>
            </div>
              <div className="flex items-center gap-3">
              <Button onClick={() => openAddBudgetDialog()}>+ Add budget</Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {loading ? (
          <BudgetSkeleton />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error loading budgets</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total budgeted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                {formatCurrency(summary.totalBudgeted, currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                {formatCurrency(summary.totalSpent, currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                {formatCurrency(summary.overallRemaining, currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent>
                    <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-4 h-24 rounded bg-slate-200 dark:bg-slate-700" />
                  </CardContent>
                </Card>
              ))
            : budgets.length > 0
            ? budgets.map((budget) => {
                const spent = budget.spent_this_month
                const limit = budget.monthly_limit
                const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0
                const progressClass = getProgressColor(percent)

                return (
                  <Card key={budget.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{budget.category}</CardTitle>
                          <CardDescription>{`Limit: ${formatCurrency(limit, currency)}`}</CardDescription>
                        </div>
                        {percent > 100 ? (
                          <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-sm text-destructive">
                            <AlertTriangle className="size-4" />
                            Over budget
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Spent: {formatCurrency(spent, currency)} ({percent}%)
                        </p>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {percent > 100 ? `Overspent: ${formatCurrency(spent - limit, currency)}` : `Remaining: ${formatCurrency(limit - spent, currency)}`}
                        </p>
                      </div>
                      <Progress
                        value={Math.min(percent, 100)}
                        barClassName={progressClass}
                        className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"
                      />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditBudgetDialog(budget)}>
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
            : (
              <Card>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No budgets created yet. Use the button above to add your first monthly budget.
                  </p>
                </CardContent>
              </Card>
            )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uncategorized expenses</CardTitle>
            <CardDescription>Expenses this month without a matching budget category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unbudgetedExpensesByCategory.length > 0 ? (
              unbudgetedExpensesByCategory.map((item) => (
                <div
                  key={item.category}
                  className="flex flex-col gap-3 rounded-3xl border border-border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.category}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(item.amount, currency)} total across {item.count} expense{item.count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openAddBudgetDialog(item.category)}>
                    Create budget
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No uncategorized expenses this month.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent>
                    <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-4 h-20 rounded bg-slate-200 dark:bg-slate-700" />
                  </CardContent>
                </Card>
              ))
            : budgets.length > 0
            ? budgets.map((budget) => {
                const spent = budget.spent_this_month
                const limit = budget.monthly_limit
                const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0
                const progressClass = getProgressColor(percent)

                return (
                  <Card key={budget.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{budget.category}</CardTitle>
                          <CardDescription>
                            {formatCurrency(limit, currency)} budgeted / {formatCurrency(spent, currency)} spent
                          </CardDescription>
                        </div>
                        {percent > 100 ? (
                          <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-sm text-destructive">
                            <AlertTriangle className="size-4" />
                            Over budget
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Remaining</p>
                          <p className="text-xl font-semibold text-slate-950 dark:text-white">
                            {formatCurrency(limit - spent, currency)}
                          </p>
                        </div>
                        <div className="text-right text-sm text-slate-500 dark:text-slate-400">{percent}%</div>
                      </div>
                      <Progress
                        value={Math.min(percent, 100)}
                        barClassName={progressClass}
                        className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"
                      />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditBudgetDialog(budget)}>
                        <Pencil className="size-4" />
                        Edit Budget
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
            : (
              <Card>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No budgets created yet. Use the button above to add your first monthly budget.
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeBudget ? "Edit budget" : "Add budget"}</DialogTitle>
            <DialogDescription>
              Set a monthly limit for a category so you can track progress through the month.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category?.message ? (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_limit">Monthly limit</Label>
                <Input id="monthly_limit" type="number" step="0.01" {...register("monthly_limit", { valueAsNumber: true })} />
                {errors.monthly_limit?.message ? (
                  <p className="text-sm text-destructive">{errors.monthly_limit.message}</p>
                ) : null}
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isSubmitting || saving}>
                {activeBudget ? "Save changes" : "Create budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
      </div>
    </ErrorBoundary>
  )
}
