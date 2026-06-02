"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Search, Filter, Utensils, Car, ShoppingBag, Clapperboard, Receipt, Smartphone, Stethoscope, BookOpen, Plane, Package, Home, Lightbulb, ShoppingCart, Shield, Pizza, Dumbbell, Briefcase, Laptop, Building2, Gift, RotateCcw, TrendingUp as TrendingUpIcon, Wallet } from "lucide-react"
import { toast } from "sonner"
import { transactionFormSchema, type TransactionFormValues } from "./TransactionForm"
import { motion, AnimatePresence } from "framer-motion"

type Transaction = {
  id: number | string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  note?: string | null
}

const expenseCategories = [
  "food", "transport", "shopping", "bills", "subscriptions",
  "entertainment", "healthcare", "education", "travel", "miscellaneous",
  "rent", "utilities", "groceries", "insurance", "dining", "gym",
]
const incomeCategories = ["salary", "freelance", "business", "gift", "refund", "investment", "other"]

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  food: Utensils, transport: Car, shopping: ShoppingBag, bills: Receipt, subscriptions: Smartphone,
  entertainment: Clapperboard, healthcare: Stethoscope, education: BookOpen, travel: Plane, miscellaneous: Package,
  rent: Home, utilities: Lightbulb, groceries: ShoppingCart, insurance: Shield, dining: Pizza, gym: Dumbbell,
  salary: Briefcase, freelance: Laptop, business: Building2, gift: Gift, refund: RotateCcw, investment: TrendingUpIcon, other: Wallet,
}

function getCategoryIcon(cat: string) { return categoryIcons[cat.toLowerCase()] ?? Wallet }

function getCategoryColor(category: string): string {
  const palette = [
    "#7C3AED", "#059669", "#D97706", "#06B6D4", "#EC4899",
    "#8B5CF6", "#10b981", "#64748B",
  ]
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) % palette.length
  }
  return palette[hash]
}

type TransactionListProps = { refreshKey?: number }

type GroupedTransactions = { date: string; label: string; transactions: Transaction[] }[]

function groupByDate(transactions: Transaction[]): GroupedTransactions {
  const groups: Record<string, Transaction[]> = {}
  transactions.forEach((tx) => {
    const date = tx.date.slice(0, 10)
    groups[date] = groups[date] ?? []
    groups[date].push(tx)
  })

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txs]) => {
      const d = new Date(date)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      let label: string
      if (d.toDateString() === today.toDateString()) label = "Today"
      else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday"
      else label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })

      return { date, label, transactions: txs }
    })
}

export function TransactionList({ refreshKey = 0 }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDeleteId, setActiveDeleteId] = useState<Transaction["id"] | null>(null)
  const [selectedDeleteTransaction, setSelectedDeleteTransaction] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedEditTransaction, setSelectedEditTransaction] = useState<Transaction | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { amount: 0, type: "expense", category: "food", date: new Date(), note: "" },
  })

  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  const editType = useWatch({ control, name: "type" })
  const categoryOptions = editType === "expense" ? expenseCategories : incomeCategories

  useEffect(() => {
    if (!selectedEditTransaction) return
    reset({ amount: selectedEditTransaction.amount, type: selectedEditTransaction.type, category: selectedEditTransaction.category, date: new Date(selectedEditTransaction.date), note: selectedEditTransaction.note || "" })
  }, [selectedEditTransaction, reset])

  const editCategory = useWatch({ control, name: "category" })
  useEffect(() => {
    if (!categoryOptions.includes(editCategory || "")) setValue("category", categoryOptions[0])
  }, [categoryOptions, setValue, editCategory])

  const fetchTransactions = async () => {
    setLoading(true)
    const res = await fetch("/api/transactions", { cache: "no-store" })
    if (!res.ok) { const j = await res.json().catch(() => ({})); toast.error(j.error || "Unable to load transactions"); setTransactions([]); setLoading(false); return }
    setTransactions(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [refreshKey])

  const handleDeleteClick = (tx: Transaction) => { setSelectedDeleteTransaction(tx); setActiveDeleteId(tx.id) }
  const handleDeleteConfirm = async () => {
    if (!selectedDeleteTransaction) return
    setDeleting(true)
    const res = await fetch(`/api/transactions?id=${selectedDeleteTransaction.id}`, { method: "DELETE" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(j.error || "Unable to delete"); setDeleting(false); return }
    toast.success("Transaction deleted")
    setTransactions((cur) => cur.filter((t) => t.id !== selectedDeleteTransaction.id))
    setDeleting(false); setActiveDeleteId(null); setSelectedDeleteTransaction(null)
  }

  const handleEditClick = (tx: Transaction) => { setSelectedEditTransaction(tx); setEditDialogOpen(true) }
  const handleUpdateSubmit = async (values: TransactionFormValues) => {
    if (!selectedEditTransaction) return
    setUpdating(true)
    const res = await fetch(`/api/transactions?id=${selectedEditTransaction.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: values.amount, type: values.type, category: values.category, date: values.date.toISOString(), note: values.note?.trim() || null }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(j.error || "Unable to update"); setUpdating(false); return }
    toast.success("Transaction updated!")
    setTransactions((cur) => cur.map((t) => t.id === selectedEditTransaction.id ? { ...t, ...values, date: values.date.toISOString() } : t))
    setUpdating(false); setSelectedEditTransaction(null); setEditDialogOpen(false)
  }

  const closeDialog = () => { setActiveDeleteId(null); setSelectedDeleteTransaction(null); setSelectedEditTransaction(null); setEditDialogOpen(false) }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = 
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.type.toLowerCase().includes(searchQuery.toLowerCase())
      
      let matchesMonth = true
      if (monthFilter !== "all") {
        const txDate = new Date(tx.date)
        const filterDate = new Date(monthFilter)
        matchesMonth = txDate.getMonth() === filterDate.getMonth() && txDate.getFullYear() === filterDate.getFullYear()
      }

      return matchesSearch && matchesMonth
    })
  }, [transactions, searchQuery, monthFilter])

  const grouped = useMemo(() => groupByDate(filteredTransactions), [filteredTransactions])

  const totals = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    return { income, expense, net: income - expense }
  }, [filteredTransactions])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    transactions.forEach(t => {
      const d = new Date(t.date)
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
    })
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  return (
    <div className="fp-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-[rgba(0,0,0,0.06)] pb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F0E17]">All Transactions</h2>
          <span className="text-xs text-[#8B89A0] font-medium">{filteredTransactions.length} transactions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B89A0]" />
            <input 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="custom-input !h-9 !pl-9 w-[160px] sm:w-[200px] !text-sm" 
            />
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-9 w-[140px] text-sm bg-white/70 border-[rgba(0,0,0,0.10)] rounded-[12px]">
              <Filter className="w-4 h-4 mr-2 text-[#8B89A0]" />
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[rgba(0,0,0,0.08)] rounded-[14px]">
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map(m => {
                const date = new Date(m)
                return <SelectItem key={m} value={m}>{date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</SelectItem>
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Totals bar */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[rgba(5,150,105,0.04)] border border-[rgba(5,150,105,0.08)] rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-emerald-600">Income</p>
            <p className="text-sm font-bold text-emerald-600">+{formatCurrency(totals.income, currency)}</p>
          </div>
          <div className="bg-[rgba(220,38,38,0.04)] border border-[rgba(220,38,38,0.08)] rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-rose-500">Expense</p>
            <p className="text-sm font-bold text-rose-500">-{formatCurrency(totals.expense, currency)}</p>
          </div>
          <div className="bg-[rgba(124,58,237,0.04)] border border-[rgba(124,58,237,0.08)] rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#7C3AED]">Net</p>
            <p className={`text-sm font-bold ${totals.net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{formatCurrency(totals.net, currency)}</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 px-3 animate-pulse">
              <div className="w-10 h-10 rounded-[12px] bg-[#F5F3FF] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 bg-[#F5F3FF] rounded-full" />
                <div className="h-2.5 w-1/4 bg-[#F5F3FF] rounded-full" />
              </div>
              <div className="h-3.5 w-16 bg-[#F5F3FF] rounded-full" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-[#F8F7FF] rounded-xl border border-dashed border-[rgba(0,0,0,0.08)] p-8 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-[#8B89A0]" />
          <p className="text-sm font-semibold text-[#0F0E17]">No transactions yet</p>
          <p className="text-xs text-[#8B89A0] mt-1">Add your first one using the form above</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#8B89A0]">{group.label}</span>
                <div className="flex-1 h-px bg-[rgba(0,0,0,0.04)]" />
                <span className="text-xs text-[#8B89A0] font-semibold tabular-nums">
                  {formatCurrency(
                    group.transactions.reduce((s, t) => t.type === "expense" ? s - t.amount : s + t.amount, 0),
                    currency
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <AnimatePresence>
                  {group.transactions.map((tx) => {
                    const isIncome = tx.type === "income"
                    const Icon = getCategoryIcon(tx.category)
                    const dotColor = getCategoryColor(tx.category)
                    return (
                      <motion.div
                        key={tx.id}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        className="flex items-center gap-3 rounded-xl py-3 px-3 transition-all hover:bg-[rgba(0,0,0,0.02)] cursor-default group"
                      >
                        {/* Left: Category dot + icon */}
                        <div className="flex items-center gap-1.5 w-10 flex-shrink-0 justify-end mr-1">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                            style={{ backgroundColor: dotColor }}
                            aria-hidden="true"
                          />
                          <Icon
                            className="w-4 h-4 text-[#8B89A0] flex-shrink-0"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#0F0E17] capitalize leading-tight truncate">{tx.category}</p>
                          {tx.note && <p className="text-[11px] text-[#8B89A0] font-medium truncate mt-0.5">{tx.note}</p>}
                        </div>
                        <p className={`text-[14px] font-bold tabular-nums flex-shrink-0 ${isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                          {isIncome ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                        </p>
                        {/* Actions — reveal on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0 pl-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(tx)} className="h-8 w-8 rounded-xl hover:bg-[rgba(0,0,0,0.04)] text-[#8B89A0] hover:text-[#0F0E17]">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(tx)} className="h-8 w-8 rounded-xl hover:bg-rose-50 text-[#8B89A0] hover:text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={activeDeleteId !== null} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent className="bg-card rounded-2xl border border-[hsl(var(--border))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-jakarta font-semibold text-foreground">Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This action cannot be undone and will affect your analytics.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90 rounded-xl" disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => open || closeDialog()}>
        <DialogContent className="bg-card rounded-2xl border border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle className="font-jakarta font-semibold text-foreground">Edit Transaction</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update transaction details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleUpdateSubmit)} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-amount" className="text-sm text-muted-foreground">Amount (₹)</Label>
                <Input id="edit-amount" type="number" step="1" {...register("amount", { valueAsNumber: true })} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
                {errors.amount?.message && <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--destructive))]">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-type" className="text-sm text-muted-foreground">Type</Label>
                <Select value={editType} onValueChange={(v) => setValue("type", v as "income" | "expense")}>
                  <SelectTrigger id="edit-type" className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-[hsl(var(--border))]">
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-category" className="text-sm text-muted-foreground">Category</Label>
                <Controller control={control} name="category" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-category" className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-[hsl(var(--border))]">
                      {categoryOptions.map((cat) => {
                        const Icon = getCategoryIcon(cat)
                        return (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {cat}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-date" className="text-sm text-muted-foreground">Date</Label>
                <Input id="edit-date" type="date" {...register("date", { valueAsDate: true })} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-note" className="text-sm text-muted-foreground">Note</Label>
                <Input id="edit-note" type="text" {...register("note")} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={closeDialog} type="button">Cancel</Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
