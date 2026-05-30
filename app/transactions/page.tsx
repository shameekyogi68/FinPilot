"use client"

import { useState } from "react"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { TransactionList } from "@/components/transactions/TransactionList"
import { Toaster } from "@/components/ui/sonner"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Add a transaction</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Create a new income or expense entry and save it to your transactions table.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <TransactionForm onSuccess={() => setRefreshKey((current) => current + 1)} />
          <TransactionList refreshKey={refreshKey} />
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
