"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Search, Trash2, X } from "lucide-react"
import { inr, inrShort } from "@/lib/utils/format"
import { getCategoryIcon } from "@/components/transactions/TransactionForm"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { toast } from "sonner"

export type Transaction = {
  id: string
  amount: number
  type: "income" | "expense"
  category: string
  note: string | null
  date: string
}

type Filter = "all" | "income" | "expense"

export function TransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const router = useRouter()
  const list = initialTransactions
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = list.filter((t) => {
    if (filter !== "all" && t.type !== filter) return false
    const haystack = `${t.note ?? ""} ${t.category}`.toLowerCase()
    if (search && !haystack.includes(search.toLowerCase())) return false
    return true
  })

  const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const handleDelete = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Unable to remove transaction")
        return
      }
      toast.success("Transaction removed")
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-white leading-[1.1]">
            <span className="font-display italic text-gradient">Transactions</span>
          </h1>
          <p className="text-[14px] text-slate-300 mt-2">All your income and expenses, in one place.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus size={14} strokeWidth={2} />
          New transaction
        </button>
      </motion.div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-tile">
          <p className="section-title mb-2 text-slate-400">Income</p>
          <p className="text-[22px] font-bold text-emerald-400 tabular-nums leading-tight">{inr(income)}</p>
        </div>
        <div className="stat-tile">
          <p className="section-title mb-2 text-slate-400">Expenses</p>
          <p className="text-[22px] font-bold text-rose-400 tabular-nums leading-tight">{inr(expense)}</p>
        </div>
        <div className="stat-tile col-span-2 sm:col-span-1">
          <p className="section-title mb-2 text-slate-400">Net</p>
          <p className="text-[22px] font-bold text-white tabular-nums leading-tight">{inr(income - expense)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
          {(["all", "income", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3.5 text-[12.5px] font-semibold rounded-lg transition-all ${
                filter === f ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "income" ? "Income" : "Expense"}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by note or category…"
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors text-[13px]"
          />
        </div>
      </div>

      {/* List */}
      <div className="surface-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[14px] text-slate-400">
              {list.length === 0 ? "No transactions yet. Add your first one." : "No transactions match your filters."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {filtered.map((t) => {
              const Icon = getCategoryIcon(t.category)
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-4 px-6 py-4 group hover:bg-white/[0.03] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    t.type === "income" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-teal-400"
                  }`}>
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate capitalize">{t.note?.trim() || t.category}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5 capitalize">
                      {t.category} · {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className={`text-[14px] font-semibold tabular-nums ${t.type === "income" ? "text-emerald-400" : "text-white"}`}>
                    {t.type === "income" ? "+" : "−"}{inrShort(t.amount)}
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={busyId === t.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgba(20,19,31,0.40)] backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-md"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#8C8AA0] hover:text-[#14131F] transition-colors z-10"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
            <TransactionForm
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}
