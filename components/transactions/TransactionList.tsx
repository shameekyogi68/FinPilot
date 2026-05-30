"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  transactionFormSchema,
  TransactionFormValues,
} from "./TransactionForm"

type Transaction = {
  id: number | string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  note?: string | null
}

const expenseCategories = [
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

const incomeCategories = ["salary", "freelance", "gift", "refund", "other"]

type TransactionListProps = {
  refreshKey?: number
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema) as any,
    defaultValues: {
      amount: 0,
      type: "expense",
      category: "food",
      date: new Date(),
      note: "",
    },
  })

  const { profile } = useProfile()
  const currency = profile?.currency ?? "USD"

  const editType = watch("type")
  const categoryOptions = editType === "expense" ? expenseCategories : incomeCategories

  useEffect(() => {
    if (!selectedEditTransaction) {
      return
    }

    reset({
      amount: selectedEditTransaction.amount,
      type: selectedEditTransaction.type,
      category: selectedEditTransaction.category,
      date: new Date(selectedEditTransaction.date),
      note: selectedEditTransaction.note || "",
    })
  }, [selectedEditTransaction, reset])

  useEffect(() => {
    const currentCategory = watch("category")
    if (!categoryOptions.includes(currentCategory || "")) {
      setValue("category", categoryOptions[0])
    }
  }, [categoryOptions, setValue, watch])

  const fetchTransactions = async () => {
    setLoading(true)

    const response = await fetch("/api/transactions", {
      cache: "no-store",
    })

    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      toast.error(json.error || "Unable to load transactions")
      setTransactions([])
      setLoading(false)
      return
    }

    const data = (await response.json()) as Transaction[]
    setTransactions(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [refreshKey])

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedDeleteTransaction(transaction)
    setActiveDeleteId(transaction.id)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDeleteTransaction) {
      return
    }

    setDeleting(true)

    const response = await fetch(`/api/transactions?id=${selectedDeleteTransaction.id}`, {
      method: "DELETE",
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error(json.error || "Unable to delete transaction")
      setDeleting(false)
      return
    }

    toast.success("Transaction deleted")
    setTransactions((current) =>
      current.filter((item) => item.id !== selectedDeleteTransaction.id)
    )
    setDeleting(false)
    setActiveDeleteId(null)
    setSelectedDeleteTransaction(null)
  }

  const handleEditClick = (transaction: Transaction) => {
    setSelectedEditTransaction(transaction)
    setEditDialogOpen(true)
  }

  const handleUpdateSubmit = async (values: TransactionFormValues) => {
    if (!selectedEditTransaction) {
      return
    }

    setUpdating(true)

    const response = await fetch(`/api/transactions?id=${selectedEditTransaction.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: values.amount,
        type: values.type,
        category: values.category,
        date: values.date.toISOString(),
        note: values.note?.trim() || null,
      }),
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error(json.error || "Unable to update transaction")
      setUpdating(false)
      return
    }

    toast.success("Transaction updated")
    setTransactions((current) =>
      current.map((item) =>
        item.id === selectedEditTransaction.id
          ? { ...item, ...values, date: values.date.toISOString() }
          : item
      )
    )
    setUpdating(false)
    setSelectedEditTransaction(null)
    setEditDialogOpen(false)
  }

  const closeDialog = () => {
    setActiveDeleteId(null)
    setSelectedDeleteTransaction(null)
    setSelectedEditTransaction(null)
    setEditDialogOpen(false)
  }

  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            All transactions ordered by date.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
          Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
          No transactions yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {transactions.map((transaction) => {
                const amountClass =
                  transaction.amount >= 0 ? "text-emerald-600" : "text-destructive"
                const formattedAmount = formatCurrency(transaction.amount, currency)
                const dateLabel = new Date(transaction.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })

                return (
                  <tr key={transaction.id} className="hover:bg-muted/70">
                    <td className="px-4 py-4 text-sm text-foreground">
                      {dateLabel}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {transaction.note || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium">
                      <span className={amountClass}>{formattedAmount}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEditClick(transaction)}
                          aria-label="Edit transaction"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => handleDeleteClick(transaction)}
                          aria-label="Delete transaction"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={activeDeleteId !== null} onOpenChange={(open) => open || closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => open || closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Update the transaction details and save the changes.
          </DialogDescription>
          <form onSubmit={handleSubmit(handleUpdateSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount?.message ? (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value as "income" | "expense")}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-category">Category</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="edit-category">
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
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" type="date" {...register("date", { valueAsDate: true })} />
                {errors.date?.message ? (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note">Note</Label>
                <Input id="edit-note" type="text" {...register("note")} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
