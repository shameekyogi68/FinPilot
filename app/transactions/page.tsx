"use client"

import { useState } from "react"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { TransactionList } from "@/components/transactions/TransactionList"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { motion } from "framer-motion"
import { ArrowLeftRight } from "lucide-react"
import Link from "next/link"

const pageVariants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <ErrorBoundary>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-medium text-[#fafafa] leading-tight">Add Transaction</h1>
            <p className="text-[14px] text-[#a1a1aa] mt-0.5">Record your income and expenses</p>
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,25,0.6)] text-[13px] text-[#e4e4e7] font-medium hover:border-[rgba(255,255,255,0.14)] hover:text-[#fafafa] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
            aria-label="Transaction history"
          >
            <ArrowLeftRight size={14} strokeWidth={1.5} aria-hidden="true" />
            History
          </Link>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <TransactionForm onSuccess={() => setRefreshKey((k) => k + 1)} />
        </motion.div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <TransactionList refreshKey={refreshKey} />
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  )
}
