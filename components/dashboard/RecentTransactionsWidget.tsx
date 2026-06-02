"use client"

import Link from "next/link"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import { Receipt } from "lucide-react"

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

const categoryEmojis: Record<string, string> = {
  food: "🍔",
  transport: "🚗",
  shopping: "🛍️",
  bills: "📱",
  entertainment: "🎬",
  healthcare: "🏥",
  education: "📚",
  travel: "✈️",
  salary: "💼",
  investment: "📈",
  groceries: "🛒",
  rent: "🏠",
  utilities: "💡",
  miscellaneous: "💳",
  default: "💳",
}

function getCategoryEmoji(category: string): string {
  const key = category.toLowerCase()
  for (const [k, v] of Object.entries(categoryEmojis)) {
    if (key.includes(k)) return v
  }
  return categoryEmojis.default
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } }
}
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export function RecentTransactionsWidget({
  transactions,
  loading,
  error,
}: RecentTransactionsWidgetProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  // Limit to 5 items on dashboard
  const displayTxs = transactions ? transactions.slice(0, 5) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="fp-card p-6 h-full flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div className="section-header-icon !mb-0">
              <Receipt size={16} strokeWidth={2} />
            </div>
            <h2 className="text-[15px] font-bold text-[#0F0E17]">Recent Transactions</h2>
          </div>
          <Link
            href="/transactions"
            className="text-[12px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-[4px]"
          >
            View All →
          </Link>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 px-3 animate-pulse">
                  <div className="w-11 h-11 rounded-[12px] bg-[#F5F3FF] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/3 bg-[#F5F3FF] rounded-full" />
                    <div className="h-2.5 w-1/4 bg-[#F5F3FF] rounded-full" />
                  </div>
                  <div className="h-3.5 w-16 bg-[#F5F3FF] rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-[13px] text-[#ef4444] bg-[#FEF2F2] p-4 rounded-[10px] border border-[rgba(220,38,38,0.15)]">
              {error}
            </div>
          ) : displayTxs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
          ) : (
            <motion.div
              className="space-y-1"
              variants={containerVariants}
              initial="initial"
              animate="animate"
            >
              {displayTxs.map((tx) => {
                const isIncome = tx.type === "income"
                const emoji = getCategoryEmoji(tx.category)

                return (
                  <motion.div
                    key={tx.id}
                    variants={itemVariants}
                    className="flex items-center gap-4 py-3 px-3 rounded-[12px] transition-all hover:bg-[rgba(0,0,0,0.02)] cursor-default group"
                  >
                    {/* Left Icon */}
                    <div
                      className={`w-11 h-11 rounded-[12px] flex items-center justify-center text-base flex-shrink-0 ${
                        isIncome
                          ? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600"
                          : "bg-gradient-to-br from-red-50 to-red-100 text-red-500"
                      } shadow-sm`}
                    >
                      {emoji}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#0F0E17] capitalize">
                          {tx.category}
                        </span>
                      </div>
                      {tx.note ? (
                        <p className="text-[11px] text-[#8B89A0] font-medium truncate mt-0.5">
                          {tx.note}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#C4C2D4] font-medium mt-0.5">
                          {formatDateLabel(tx.date)}
                        </p>
                      )}
                    </div>

                    {/* Right Amount */}
                    <p
                      className={`text-[14px] font-bold tabular-nums flex-shrink-0 ${
                        isIncome ? "text-emerald-600" : "text-[#ef4444]"
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
      </div>
    </motion.div>
  )
}
