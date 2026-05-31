"use client"

import { useState } from "react"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { TransactionList } from "@/components/transactions/TransactionList"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Transactions</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Add & Track
            </h1>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TransactionForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          </motion.div>

          {/* List */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <TransactionList refreshKey={refreshKey} />
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
