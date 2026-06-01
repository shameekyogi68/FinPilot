"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { toast } from "sonner"
import {
  TrendingUp, TrendingDown, Utensils, Car, ShoppingBag, Receipt,
  Smartphone, Film, Heart, Book, Plane, Package, Home, Lightbulb,
  ShoppingCart, Shield, Pizza, Dumbbell, Briefcase, Laptop, Building2,
  Gift, RotateCcw, Wallet, Loader2,
} from "lucide-react"

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

export function getCategoryEmoji(cat: string) {
  const key = cat.toLowerCase()
  for (const [k, v] of Object.entries(categoryEmojis)) {
    if (key.includes(k)) return v
  }
  return "💳"
}

const categoryIcons: Record<string, React.ElementType> = {
  food: Utensils, transport: Car, shopping: ShoppingBag, bills: Receipt, subscriptions: Smartphone,
  entertainment: Film, healthcare: Heart, education: Book, travel: Plane, miscellaneous: Package,
  rent: Home, utilities: Lightbulb, groceries: ShoppingCart, insurance: Shield, dining: Pizza, gym: Dumbbell,
  salary: Briefcase, freelance: Laptop, business: Building2, gift: Gift, refund: RotateCcw, investment: TrendingUp, other: Wallet,
}

export function getCategoryIcon(cat: string): React.ElementType {
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
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      type: "expense",
      category: expenseCategories[0],
      date: new Date(),
      note: "",
    },
  })

  const transactionType = useWatch({ control, name: "type" })
  const categoryOptions = transactionType === "expense" ? expenseCategories : incomeCategories

  const onSubmit = async (values: TransactionFormValues) => {
    const cat = values.category.toLowerCase().trim()
    const payload = {
      amount: values.amount,
      type: values.type,
      category: cat,
      date: values.date.toISOString(),
      note: values.note?.trim() || null,
    }
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error || "Unable to add transaction")
      return
    }
    toast.success(
      transactionType === "income" ? "Income recorded!" : "Expense recorded!",
      {
        description: `-₹${values.amount.toLocaleString("en-IN")} · ${cat}`,
        style: {
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          borderRadius: "10px",
        },
      }
    )
    reset({ amount: undefined as unknown as number, type: values.type, category: categoryOptions[0], date: new Date(), note: "" })
    onSuccess?.()
  }

  return (
    <div className="fp-card p-5">
      {/* ── Type Toggle ── */}
      <div
        className="flex mb-5 p-1 rounded-[999px] border border-[rgba(0,0,0,0.06)]"
        style={{ background: "#F8F7FF" }}
        role="group"
        aria-label="Transaction type"
      >
        <button
          type="button"
          id="toggle-expense"
          onClick={() => { setValue("type", "expense"); setValue("category", expenseCategories[0]) }}
          aria-pressed={transactionType === "expense"}
          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-[999px] text-[14px] font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 ${
            transactionType === "expense"
              ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.06)] text-[#0F0E17]"
              : "text-[#8B89A0] hover:text-[#4B4963]"
          }`}
        >
          <TrendingDown size={14} strokeWidth={1.5} aria-hidden="true" />
          Expense
        </button>
        <button
          type="button"
          id="toggle-income"
          onClick={() => { setValue("type", "income"); setValue("category", incomeCategories[0]) }}
          aria-pressed={transactionType === "income"}
          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-[999px] text-[14px] font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 ${
            transactionType === "income"
              ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.06)] text-[#0F0E17]"
              : "text-[#8B89A0] hover:text-[#4B4963]"
          }`}
        >
          <TrendingUp size={14} strokeWidth={1.5} aria-hidden="true" />
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* ── Amount ── */}
        <div>
          <label
            htmlFor="tx-amount"
            className="block text-[12px] font-medium text-[#4B4963] mb-1.5"
          >
            Amount
          </label>
          <div className="flex rounded-[10px] border border-[rgba(0,0,0,0.10)] overflow-hidden focus-within:border-[#7C3AED] focus-within:ring-[3px] focus-within:ring-[rgba(124,58,237,0.18)] transition-all duration-150">
            <div
              className="w-12 flex items-center justify-center text-[18px] font-medium text-[#4B4963] border-r border-[rgba(0,0,0,0.08)] flex-shrink-0"
              style={{ background: "#F8F7FF" }}
              aria-hidden="true"
            >
              ₹
            </div>
            <input
              id="tx-amount"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              {...register("amount", { valueAsNumber: true })}
              className="flex-1 h-[52px] px-4 text-[22px] font-medium text-[#0F0E17] tabular-nums bg-white outline-none border-0 focus:ring-0 focus:outline-none"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "tx-amount-error" : undefined}
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>
          {errors.amount?.message && (
            <p id="tx-amount-error" className="text-[11px] text-[#DC2626] mt-1">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* ── Date ── */}
          <div>
            <label htmlFor="tx-date" className="block text-[12px] font-medium text-[#4B4963] mb-1.5">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              {...register("date", { valueAsDate: true })}
              className="w-full h-11 px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.10)] text-[15px] text-[#0F0E17] bg-white outline-none transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]"
              aria-invalid={!!errors.date}
            />
            {errors.date?.message && (
              <p className="text-[11px] text-[#DC2626] mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* ── Category ── */}
          <div>
            <label htmlFor="tx-category" className="block text-[12px] font-medium text-[#4B4963] mb-1.5">
              Category
            </label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <CreatableSelect
                  id="tx-category"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select or type..."
                  options={categoryOptions.map((cat) => ({
                    value: cat,
                    label: cat,
                    icon: getCategoryEmoji(cat),
                  }))}
                />
              )}
            />
            {errors.category?.message && (
              <p className="text-[11px] text-[#DC2626] mt-1">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* ── Note ── */}
        <div>
          <label htmlFor="tx-note" className="block text-[12px] font-medium text-[#4B4963] mb-1.5">
            Note <span className="text-[#8B89A0] font-normal">(Optional)</span>
          </label>
          <input
            id="tx-note"
            type="text"
            placeholder="e.g. Monthly rent, Swiggy order..."
            {...register("note")}
            className="w-full h-11 px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.10)] text-[15px] text-[#0F0E17] bg-white outline-none placeholder:text-[#C4C2D4] transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]"
          />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-[10px] bg-[#7C3AED] text-white text-[15px] font-medium transition-all duration-150 hover:bg-[#6D28D9] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            `Add ${transactionType === "income" ? "Income" : "Expense"}`
          )}
        </button>
      </form>
    </div>
  )
}
