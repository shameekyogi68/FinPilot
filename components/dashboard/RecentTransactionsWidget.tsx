"use client"

import Link from "next/link"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import {
  ArrowRight, Receipt, Utensils, Car, ShoppingBag, Smartphone,
  Clapperboard, Stethoscope, BookOpen, Plane, Package, ShoppingCart,
  Home, Lightbulb, Briefcase, Wallet, Laptop, TrendingUp, CreditCard,
  ClipboardList,
} from "lucide-react"

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

const categoryIcons: Record<string, React.ElementType> = {
  food: Utensils, transport: Car, shopping: ShoppingBag, bills: Receipt,
  subscriptions: Smartphone, entertainment: Clapperboard, healthcare: Stethoscope,
  education: BookOpen, travel: Plane, miscellaneous: Package,
  groceries: ShoppingCart, rent: Home, utilities: Lightbulb,
  salary: Briefcase, income: Wallet, freelance: Laptop,
  investment: TrendingUp, default: CreditCard,
}

function getCategoryIcon(category: string): React.ElementType {
  const key = category.toLowerCase()
  for (const [k, v] of Object.entries(categoryIcons)) {
    if (key.includes(k)) return v
  }
  return categoryIcons.default
}

// Category dot color
function getCategoryColor(category: string): string {
  const palette = [
    "#7C3AED", "#059669", "#D97706", "#06B6D4", "#EC4899",
    "#8B5CF6", "#10B981", "#64748B",
  ]
  let hash = 0
  for (const c of category) hash = (hash * 31 + c.charCodeAt(0)) % palette.length
  return palette[hash]
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

// Group by date
function groupByDate(txs: RecentTransaction[]) {
  const groups: Record<string, RecentTransaction[]> = {}
  for (const tx of txs) {
    const key = formatRelativeDate(tx.date)
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  }
  return groups
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } }
}
const itemVariants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const } },
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
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="fp-card p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <Receipt size={16} strokeWidth={1.5} className="text-[#4B4963]" aria-hidden="true" />
          <h2 className="text-[15px] font-medium text-[#0F0E17]">Recent Transactions</h2>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-[12px] text-[#7C3AED] font-medium hover:text-[#6D28D9] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-[4px] px-1"
        >
          View all <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-[rgba(0,0,0,0.05)] last:border-0 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[#F8F7FF] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded-full bg-[#F8F7FF]" />
                  <div className="h-2.5 w-1/3 rounded-full bg-[#F8F7FF]" />
                </div>
                <div className="h-3.5 w-16 rounded-full bg-[#F8F7FF]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-[13px] text-[#DC2626] bg-[#FEF2F2] p-4 rounded-[10px] border border-[rgba(220,38,38,0.15)]">
            {error}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-center">
            <div>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
                <rect x="12" y="16" width="40" height="32" rx="4" fill="#EDE9FE" />
                <rect x="18" y="24" width="28" height="2.5" rx="1.25" fill="#C4B5FD" />
                <rect x="18" y="30" width="20" height="2.5" rx="1.25" fill="#DDD6FE" />
                <rect x="18" y="36" width="14" height="2.5" rx="1.25" fill="#DDD6FE" />
                <circle cx="50" cy="46" r="10" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="1.5" />
                <path d="M50 42v4l2.5 2.5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[14px] text-[#4B4963]">No transactions yet</p>
              <Link
                href="/transactions"
                className="text-[13px] text-[#7C3AED] underline mt-1.5 inline-block hover:text-[#6D28D9] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-[4px]"
              >
                Add your first transaction →
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {Object.entries(groupByDate(transactions)).map(([dateLabel, txs]) => (
              <div key={dateLabel}>
                {/* Sticky date header */}
                <div className="sticky top-0 py-1 bg-white z-10">
                  <span className="label-xs text-[#8B89A0]">{dateLabel}</span>
                </div>

                {txs.map((tx) => {
                  const isIncome = tx.type === "income"
                  const Icon = getCategoryIcon(tx.category)
                  const dotColor = getCategoryColor(tx.category)

                  return (
                    <motion.div
                      key={tx.id}
                      variants={itemVariants}
                      className="flex items-center gap-3 min-h-[56px] py-2 border-b border-[rgba(0,0,0,0.05)] last:border-0 hover:bg-[#F8F7FF] transition-colors duration-150 cursor-default rounded-[6px] px-1 -mx-1"
                    >
                      {/* Left: category dot + icon */}
                      <div className="flex items-center gap-1.5 w-10 flex-shrink-0 justify-end">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                          aria-hidden="true"
                        />
                        <Icon
                          size={16}
                          strokeWidth={1.5}
                          className="text-[#8B89A0]"
                          aria-hidden="true"
                        />
                      </div>

                      {/* Center: merchant name + note */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#0F0E17] capitalize leading-tight truncate">
                          {tx.category}
                        </p>
                        {tx.note && (
                          <p className="text-[13px] text-[#8B89A0] leading-tight truncate mt-0.5">{tx.note}</p>
                        )}
                      </div>

                      {/* Right: amount */}
                      <p
                        className={`text-[14px] font-medium tabular-nums flex-shrink-0 ${
                          isIncome ? "text-[#059669]" : "text-[#DC2626]"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount, currency)}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
