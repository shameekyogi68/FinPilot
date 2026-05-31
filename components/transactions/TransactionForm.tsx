"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { toast } from "sonner"
import { TrendingUp, TrendingDown, Utensils, Car, ShoppingBag, Receipt, Smartphone, Film, Heart, Book, Plane, Package, Home, Lightbulb, ShoppingCart, Shield, Pizza, Dumbbell, Briefcase, Laptop, Building2, Gift, RotateCcw, TrendingUp as TrendUpIcon, Wallet } from "lucide-react"

const expenseCategories = [
  "food", "transport", "shopping", "bills", "subscriptions",
  "entertainment", "healthcare", "education", "travel", "miscellaneous",
  "rent", "utilities", "groceries", "insurance", "dining", "gym",
]

const incomeCategories = ["salary", "freelance", "business", "gift", "refund", "investment", "other"]

const categoryEmojis: Record<string, string> = {
  food: "🍽️", transport: "🚗", shopping: "🛍️", bills: "🧾", subscriptions: "📱",
  entertainment: "🎬", healthcare: "🏥", education: "📚", travel: "✈️", miscellaneous: "📦",
  rent: "🏠", utilities: "💡", groceries: "🛒", insurance: "🛡️", dining: "🍕", gym: "💪",
  salary: "💼", freelance: "💻", business: "🏢", gift: "🎁", refund: "↩️", investment: "📈", other: "💰",
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  food: Utensils, transport: Car, shopping: ShoppingBag, bills: Receipt, subscriptions: Smartphone,
  entertainment: Film, healthcare: Heart, education: Book, travel: Plane, miscellaneous: Package,
  rent: Home, utilities: Lightbulb, groceries: ShoppingCart, insurance: Shield, dining: Pizza, gym: Dumbbell,
  salary: Briefcase, freelance: Laptop, business: Building2, gift: Gift, refund: RotateCcw, investment: TrendUpIcon, other: Wallet,
}

export function getCategoryEmoji(cat: string) {
  const key = cat.toLowerCase()
  for (const [k, v] of Object.entries(categoryEmojis)) {
    if (key.includes(k)) return v
  }
  return "💳"
}

export function getCategoryIcon(cat: string) {
  const key = cat.toLowerCase()
  for (const [k, v] of Object.entries(categoryIcons)) {
    if (key.includes(k)) return v
  }
  return Wallet
}

export const transactionFormSchema = z.object({
  amount: z.number().positive({ message: "Amount must be positive" }),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  date: z.date(),
  note: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

type TransactionFormProps = {
  onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { amount: 0, type: "expense", category: expenseCategories[0], date: new Date(), note: "" },
  })

  const transactionType = useWatch({ control, name: "type" })
  const categoryOptions = transactionType === "expense" ? expenseCategories : incomeCategories

  const onSubmit = async (values: TransactionFormValues) => {
    // Sanitize category to lowercase for consistency
    const cat = values.category.toLowerCase().trim()
    const payload = { amount: values.amount, type: values.type, category: cat, date: values.date.toISOString(), note: values.note?.trim() || null }
    const res = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(json.error || "Unable to add transaction"); return }
    toast.success(`${transactionType === "income" ? "Income" : "Expense"} recorded!`)
    reset({ amount: undefined, type: values.type, category: categoryOptions[0], date: new Date(), note: "" })
    onSuccess?.()
  }

  return (
    <div className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-5">
      {/* Type toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-[hsl(var(--muted))]">
        <button
          type="button"
          onClick={() => setValue("type", "expense")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            transactionType === "expense"
              ? "bg-[var(--expense-bg)] text-[hsl(var(--expense))] border border-[var(--expense-border)]"
              : "text-muted-foreground"
          }`}
        >
          <TrendingDown className="w-4 h-4" /> Expense
        </button>
        <button
          type="button"
          onClick={() => setValue("type", "income")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            transactionType === "income"
              ? "bg-[var(--income-bg)] text-[hsl(var(--income))] border border-[var(--income-border)]"
              : "text-muted-foreground"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Income
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-amount" className="text-sm text-muted-foreground">Amount (₹)</Label>
            <Input id="tx-amount" type="number" step="1" placeholder="0" {...register("amount", { valueAsNumber: true })} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-base font-medium" />
            {errors.amount?.message && <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--destructive))]">{errors.amount.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-date" className="text-sm text-muted-foreground">Date</Label>
            <Input id="tx-date" type="date" {...register("date", { valueAsDate: true })} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
            {errors.date?.message && <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--destructive))]">{errors.date.message}</p>}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="tx-category" className="text-sm text-muted-foreground">Category (Type to create new)</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CreatableSelect
                id="tx-category"
                value={field.value}
                onChange={field.onChange}
                placeholder="Select or type custom category..."
                className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
                options={categoryOptions.map(cat => ({
                  value: cat,
                  label: cat,
                  icon: getCategoryEmoji(cat)
                }))}
              />
            )}
          />
          {errors.category?.message && <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--destructive))]">{errors.category.message}</p>}
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="tx-note" className="text-sm text-muted-foreground">Note (Optional)</Label>
          <Input id="tx-note" type="text" placeholder="e.g. Monthly rent, Swiggy order..." {...register("note")} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl font-semibold h-11 text-sm bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
        >
          {isSubmitting ? "Saving…" : `Add ${transactionType === "income" ? "Income" : "Expense"}`}
        </Button>
      </form>
    </div>
  )
}
