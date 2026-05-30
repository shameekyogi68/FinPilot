"use client"

import Link from "next/link"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export function RecentTransactionsWidget({
  transactions,
  loading,
  error,
}: RecentTransactionsWidgetProps) {
  const { profile } = useProfile()
  const currency = profile?.currency ?? "USD"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex animate-pulse items-center justify-between gap-4 rounded-2xl bg-muted p-4">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-300/60 dark:bg-slate-700" />
                  <div className="h-3 w-24 rounded bg-slate-300/60 dark:bg-slate-700" />
                </div>
                <div className="h-5 w-20 rounded bg-slate-300/60 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const tone = transaction.type === "income" ? "text-emerald-600" : "text-destructive"
              return (
                <div key={transaction.id} className="rounded-3xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{transaction.category}</p>
                      <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}</p>
                    </div>
                    <p className={`text-sm font-semibold ${tone}`}>{formatCurrency(transaction.amount, currency)}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{transaction.note || "No note"}</p>
                </div>
              )
            })}
            <div className="text-right">
              <Link
                href="/transactions"
                className="text-sm font-medium text-primary hover:underline"
              >
                View full transaction list
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
