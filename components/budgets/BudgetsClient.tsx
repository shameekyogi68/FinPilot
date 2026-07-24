"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2, AlertCircle, X, Wallet, TrendingUp, CheckCircle, ShieldCheck } from "lucide-react"
import { inr } from "@/lib/utils/format"
import { categoryColor } from "@/lib/utils/categoryStyle"
import { getCategoryIcon } from "@/components/transactions/TransactionForm"
import type { BudgetWithSpend } from "@/lib/queries/queries"
import { toast } from "sonner"

export function BudgetsClient({ initialBudgets }: { initialBudgets: BudgetWithSpend[] }) {
  const router = useRouter()
  const budgets = initialBudgets
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetWithSpend | null>(null)
  const [busy, setBusy] = useState(false)

  const totalBudgeted = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent_this_month, 0)
  const remaining = totalBudgeted - totalSpent
  const overall = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
  const essentialFloor = budgets.filter((b) => b.essential).reduce((s, b) => s + b.monthly_limit, 0)

  const handleSave = async (data: { category: string; monthly_limit: number; essential: boolean }) => {
    setBusy(true)
    try {
      const res = await fetch(editing ? `/api/budgets?id=${editing.id}` : "/api/budgets", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to save budget")
        return
      }
      toast.success(editing ? "Budget updated" : "Budget created")
      setOpen(false)
      setEditing(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Unable to remove budget")
        return
      }
      toast.success("Budget removed")
      router.refresh()
    } finally {
      setBusy(false)
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
            <span className="font-display italic text-gradient">Budgets</span>
          </h1>
          <p className="text-[14px] text-slate-300 mt-2">Mark what&apos;s essential — that&apos;s what a lean month still has to cover.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="btn-primary"
        >
          <Plus size={14} strokeWidth={2} />
          New budget
        </button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SummaryTile
          icon={<TrendingUp size={16} strokeWidth={1.75} className="text-emerald-400" />}
          label="Total budgeted"
          value={inr(totalBudgeted)}
          tone="brand"
        />
        <SummaryTile
          icon={<Wallet size={16} strokeWidth={1.75} className="text-teal-400" />}
          label="Spent so far"
          value={inr(totalSpent)}
          tone="default"
        />
        <SummaryTile
          icon={<CheckCircle size={16} strokeWidth={1.75} className={remaining < 0 ? "text-rose-400" : "text-emerald-400"} />}
          label="Remaining"
          value={inr(remaining)}
          tone={remaining < 0 ? "loss" : "gain"}
        />
        <SummaryTile
          icon={<ShieldCheck size={16} strokeWidth={1.75} className="text-amber-400" />}
          label="Essential floor"
          value={inr(essentialFloor)}
          tone="brand"
        />
      </div>

      {/* Overall bar */}
      {budgets.length > 0 && (
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-white">Overall utilization</p>
            <p className="text-[13px] font-semibold text-white tabular-nums">{overall.toFixed(0)}%</p>
          </div>
          <div className="progress-track !h-3 bg-white/10">
            <div
              className={`progress-fill ${overall > 100 ? "loss" : overall > 80 ? "warn" : "gain"}`}
              style={{ width: `${Math.min(overall, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid */}
      {budgets.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b, idx) => {
            const pct = (b.spent_this_month / Math.max(b.monthly_limit, 1)) * 100
            const tone = pct > 100 ? "loss" : pct > 80 ? "warn" : "gain"
            const Icon = getCategoryIcon(b.category)
            const color = categoryColor(b.category)

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="surface-card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10"
                      style={{ background: `${color}22`, color }}
                    >
                      <Icon size={18} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-white capitalize">{b.category}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        {pct.toFixed(0)}% used
                        {b.essential && (
                          <span className="pill pill-brand !py-0 !px-1.5 !text-[10px]">Essential</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(b)
                        setOpen(true)
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      aria-label="Edit budget"
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={busy}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                      aria-label="Delete budget"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2.5">
                  <p className="text-[12px] text-slate-400 tabular-nums">
                    <span className={`font-semibold ${tone === "loss" ? "text-rose-400" : "text-white"}`}>{inr(b.spent_this_month)}</span>
                    <span className="mx-1.5">of</span>
                    <span>{inr(b.monthly_limit)}</span>
                  </p>
                  <p className={`text-[12px] font-semibold tabular-nums ${tone === "loss" ? "text-rose-400" : "text-emerald-400"}`}>
                    {pct > 100
                      ? `Over by ${inr(b.spent_this_month - b.monthly_limit)}`
                      : `${inr(b.monthly_limit - b.spent_this_month)} left`}
                  </p>
                </div>

                <div className="progress-track !h-2.5 bg-white/10">
                  <div
                    className={`progress-fill ${tone}`}
                    style={{ width: `${Math.min(pct, 100)}%`, background: tone === "loss" ? "linear-gradient(90deg, #EF4444, #B91C1C)" : tone === "warn" ? "linear-gradient(90deg, #F59E0B, #D97706)" : `linear-gradient(90deg, ${color}88, ${color})` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {open && (
        <BudgetModal
          initial={editing}
          busy={busy}
          onClose={() => {
            setOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "default" | "brand" | "gain" | "loss"
}) {
  const valueColor =
    tone === "loss" ? "text-rose-400" : tone === "gain" ? "text-emerald-400" : "text-white"
  return (
    <div className="stat-tile">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="section-title text-slate-400">{label}</p>
      </div>
      <p className={`text-[22px] font-bold tabular-nums leading-tight ${valueColor}`}>{value}</p>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="surface-card p-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={22} strokeWidth={1.5} className="text-emerald-400" />
      </div>
      <p className="text-[15px] font-bold text-white">No budgets yet</p>
      <p className="text-[13px] text-slate-400 mt-1 mb-5">Set monthly limits for the categories that matter.</p>
      <button onClick={onAdd} className="btn-primary">
        <Plus size={14} strokeWidth={2} />
        Create your first budget
      </button>
    </div>
  )
}

function BudgetModal({
  initial,
  busy,
  onClose,
  onSave,
}: {
  initial: BudgetWithSpend | null
  busy: boolean
  onClose: () => void
  onSave: (data: { category: string; monthly_limit: number; essential: boolean }) => void
}) {
  const [category, setCategory] = useState(initial?.category ?? "")
  const [limit, setLimit] = useState(initial ? String(initial.monthly_limit) : "")
  const [essential, setEssential] = useState(initial?.essential ?? false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(limit)
    if (!category.trim() || isNaN(num) || num <= 0) return
    onSave({ category: category.trim(), monthly_limit: num, essential })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.form
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onSubmit={submit}
        className="relative bg-[#12151E] rounded-3xl shadow-2xl p-7 w-full max-w-md border border-white/10 text-white"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <h2 className="text-[20px] font-bold text-white tracking-tight">
          {initial ? "Edit budget" : "New budget"}
        </h2>
        <p className="text-[13px] text-slate-400 mt-1">Pick a category and set a monthly cap.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="section-title block mb-2 text-slate-400">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              autoFocus
              placeholder="e.g. groceries"
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="section-title block mb-2 text-slate-400">Monthly limit</label>
            <div className="flex items-baseline gap-2 border-b-2 border-white/20 py-2">
              <span className="text-[18px] font-medium text-slate-400">₹</span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent outline-none text-[26px] font-bold tabular-nums text-white placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
            <div>
              <p className="text-[13.5px] font-semibold text-white">Essential</p>
              <p className="text-[12px] text-slate-400">Must be covered even in a lean, low-income month</p>
            </div>
            <button
              type="button"
              onClick={() => setEssential((v) => !v)}
              className={`toggle ${essential ? "on" : ""}`}
              aria-pressed={essential}
            />
          </div>
        </div>

        <div className="mt-7 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-ghost text-slate-400 hover:text-white">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{initial ? "Save changes" : "Create budget"}</button>
        </div>
      </motion.form>
    </div>
  )
}
