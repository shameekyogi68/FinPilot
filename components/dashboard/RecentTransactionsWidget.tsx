"use client"

import Link from "next/link"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { ArrowRight, Receipt, Utensils, Car, ShoppingBag, Smartphone, Clapperboard, Stethoscope, BookOpen, Plane, Package, ShoppingCart, Home, Lightbulb, Briefcase, Wallet, Laptop, TrendingUp, CreditCard, ClipboardList } from "lucide-react"

export type RecentTransaction = {
  id: number | string
  date: string
  category: string
  amount: number
  note?: string | null
  type: "income" | "expense"
}

type RecentTransactionsWidgetProps = {
  transactions: RecentTransaction[] | null
  loading: boolean
  error: string | null
}

const categoryIcons: Record<string, any> = {
  food: Utensils, transport: Car, shopping: ShoppingBag, bills: Receipt,
  subscriptions: Smartphone, entertainment: Clapperboard, healthcare: Stethoscope,
  education: BookOpen, travel: Plane, miscellaneous: Package,
  groceries: ShoppingCart, rent: Home, utilities: Lightbulb,
  salary: Briefcase, income: Wallet, freelance: Laptop,
  investment: TrendingUp, default: CreditCard,
}

function getCategoryIcon(category: string) {
  const key = category.toLowerCase()
  for (const [k, v] of Object.entries(categoryIcons)) {
    if (key.includes(k)) return v
  }
  return categoryIcons.default
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: 16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
}

export function RecentTransactionsWidget({
  transactions,
  loading,
  error,
}: RecentTransactionsWidgetProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 30 }}
      className="bg-card rounded-2xl p-6 border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] h-full flex flex-col relative overflow-hidden"
    >
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
              <Receipt className="w-4 h-4 text-[hsl(var(--primary))]" />
            </div>
            <h3 className="font-jakarta font-semibold text-base text-foreground">Recent Transactions</h3>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted))] p-3 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--border))] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded bg-[hsl(var(--border))]" />
                  <div className="h-2.5 w-1/3 rounded bg-[hsl(var(--border))]" />
                </div>
                <div className="h-4 w-16 rounded bg-[hsl(var(--border))]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-[hsl(var(--destructive))] bg-[var(--expense-bg)] p-4 rounded-xl border border-[var(--expense-border)]">
            {error}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border-dashed border-[hsl(var(--border-strong))] bg-card p-8 text-center">
            <div>
              <div className="mx-auto w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center mb-3">
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No transactions yet</p>
              <Link
                href="/transactions"
                className="text-xs text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 mt-2 inline-block font-semibold"
              >
                Add your first transaction →
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {transactions.map((tx) => {
              const isIncome = tx.type === "income"
              const Icon = getCategoryIcon(tx.category)

              return (
                <motion.div
                  key={tx.id}
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-xl bg-card hover:bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] last:border-0 p-3.5 transition-colors cursor-default"
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${
                      isIncome ? "bg-[var(--income-bg)]" : "bg-[var(--expense-bg)]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isIncome ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize leading-tight truncate">
                      {tx.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {formatRelativeDate(tx.date)}
                      {tx.note && (
                        <span className="hidden sm:inline"> · {tx.note}</span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <p
                    className={`font-sora text-sm font-semibold flex-shrink-0 ${
                      isIncome
                        ? "text-[hsl(var(--income))]"
                        : "text-[hsl(var(--expense))]"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
