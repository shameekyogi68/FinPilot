"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2, Calendar, Trophy, X, Wallet, Target } from "lucide-react"
import { inr } from "@/lib/utils/format"
import { toast } from "sonner"

export type Goal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
}

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const router = useRouter()
  const goals = initialGoals
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [fundsFor, setFundsFor] = useState<Goal | null>(null)
  const [busy, setBusy] = useState(false)

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const overall = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length

  const handleSave = async (data: { name: string; targetAmount: number; currentAmount: number; deadline: string }) => {
    setBusy(true)
    try {
      const payload = { ...data, deadline: data.deadline || null }
      const res = await fetch(editing ? `/api/goals/${editing.id}` : "/api/goals", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to save goal")
        return
      }
      toast.success(editing ? "Goal updated" : "Goal created")
      setOpen(false)
      setEditing(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleAddFunds = async (goal: Goal, amount: number) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: goal.currentAmount + amount }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Unable to add funds")
        return
      }
      setFundsFor(null)
      toast.success(`Added ${inr(amount)} to your goal`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Unable to remove goal")
        return
      }
      toast.success("Goal removed")
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
            <span className="font-display italic text-gradient">Goals</span>
          </h1>
          <p className="text-[14px] text-slate-300 mt-2">Milestones that turn saving into a story.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="btn-primary"
        >
          <Plus size={14} strokeWidth={2} />
          New goal
        </button>
      </motion.div>

      {/* Overall */}
      {goals.length > 0 && (
        <div className="surface-card p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="section-title mb-2 text-slate-400">Total goals</p>
              <p className="text-[24px] font-bold text-white leading-tight">{goals.length}</p>
            </div>
            <div>
              <p className="section-title mb-2 text-slate-400">Completed</p>
              <p className="text-[24px] font-bold text-emerald-400 leading-tight flex items-center gap-1.5">
                {completed}
                <Trophy size={16} strokeWidth={1.75} className="text-amber-400" />
              </p>
            </div>
            <div>
              <p className="section-title mb-2 text-slate-400">Saved</p>
              <p className="text-[18px] font-bold text-white tabular-nums leading-tight">{inr(totalSaved)}</p>
            </div>
            <div>
              <p className="section-title mb-2 text-slate-400">Overall</p>
              <p className="text-[24px] font-bold tabular-nums leading-tight">
                <span className="text-gradient">{overall.toFixed(0)}%</span>
              </p>
            </div>
          </div>
          <div className="progress-track !h-2 mt-5 bg-white/10">
            <div className="progress-fill" style={{ width: `${Math.min(overall, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Goal grid */}
      {goals.length === 0 ? (
        <div className="surface-card p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Target size={22} strokeWidth={1.5} className="text-emerald-400" />
          </div>
          <p className="text-[15px] font-bold text-white">No goals yet</p>
          <p className="text-[13px] text-slate-400 mt-1 mb-5">Start with a small win. The first one is the hardest.</p>
          <button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className="btn-primary"
          >
            <Plus size={14} strokeWidth={2} />
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g, idx) => {
            const percent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
            const isComplete = percent >= 100
            const days = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="surface-card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isComplete ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      <Target size={20} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-white leading-tight">{g.name}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.75} />
                        {isComplete
                          ? "Goal achieved"
                          : days === null
                          ? "No deadline set"
                          : days > 0
                          ? `${days} days left`
                          : "Deadline passed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(g)
                        setOpen(true)
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      aria-label="Edit goal"
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={busy}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Ring */}
                <div className="flex items-center gap-5 mb-4">
                  <div className="relative w-[72px] h-[72px] flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="url(#goalGrad)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 44}
                        initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                        animate={{ strokeDashoffset: (2 * Math.PI * 44) * (1 - percent / 100) }}
                        transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
                      />
                      <defs>
                        <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {isComplete ? (
                        <Trophy size={18} strokeWidth={1.75} className="text-amber-400" />
                      ) : (
                        <>
                          <span className="text-[15px] font-bold text-white leading-none">{percent.toFixed(0)}%</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">done</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-slate-400">Saved</p>
                    <p className="text-[18px] font-bold text-white tabular-nums leading-tight">{inr(g.currentAmount)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">of {inr(g.targetAmount)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setFundsFor(g)}
                  disabled={isComplete}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-[12.5px] font-bold text-white transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Wallet size={13} strokeWidth={1.75} />
                  {isComplete ? "Goal achieved" : "Add funds"}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {open && (
        <GoalModal
          initial={editing}
          busy={busy}
          onClose={() => {
            setOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}

      {fundsFor && (
        <AddFundsModal
          goal={fundsFor}
          busy={busy}
          onClose={() => setFundsFor(null)}
          onAdd={(amount) => handleAddFunds(fundsFor, amount)}
        />
      )}
    </div>
  )
}

function GoalModal({
  initial,
  busy,
  onClose,
  onSave,
}: {
  initial: Goal | null
  busy: boolean
  onClose: () => void
  onSave: (d: { name: string; targetAmount: number; currentAmount: number; deadline: string }) => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.targetAmount) : "")
  const [currentAmount, setCurrentAmount] = useState(initial ? String(initial.currentAmount) : "")
  const [deadline, setDeadline] = useState(initial?.deadline ? initial.deadline.slice(0, 10) : "")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = parseFloat(targetAmount)
    if (!name.trim() || !t || t <= 0) return
    onSave({ name: name.trim(), targetAmount: t, currentAmount: parseFloat(currentAmount) || 0, deadline })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(20,19,31,0.40)] backdrop-blur-sm" onClick={onClose} />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onSubmit={submit}
        className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-md border border-[rgba(20,19,31,0.06)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#F4F1FB] hover:text-[#14131F] transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <h2 className="text-[20px] font-semibold text-[#14131F] tracking-tight">
          {initial ? "Edit goal" : "New goal"}
        </h2>
        <p className="text-[13px] text-[#565469] mt-1">A clear target with a deadline changes everything.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="section-title block mb-2">Title</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="e.g. Emergency fund"
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-title block mb-2">Target</label>
              <div className="flex items-baseline gap-1.5 border-b-2 border-[#14131F] py-1.5">
                <span className="text-[14px] font-medium text-[#565469]">₹</span>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent outline-none text-[18px] font-semibold tabular-nums text-[#14131F] placeholder:text-[#C4C2D4]"
                />
              </div>
            </div>
            <div>
              <label className="section-title block mb-2">Saved already</label>
              <div className="flex items-baseline gap-1.5 border-b-2 border-[#14131F] py-1.5">
                <span className="text-[14px] font-medium text-[#565469]">₹</span>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent outline-none text-[18px] font-semibold tabular-nums text-[#14131F] placeholder:text-[#C4C2D4]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="section-title block mb-2">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div className="mt-7 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{initial ? "Save changes" : "Create goal"}</button>
        </div>
      </motion.form>
    </div>
  )
}

function AddFundsModal({
  goal,
  busy,
  onClose,
  onAdd,
}: {
  goal: Goal
  busy: boolean
  onClose: () => void
  onAdd: (amount: number) => void
}) {
  const [amount, setAmount] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const a = parseFloat(amount)
    if (!a || a <= 0) return
    onAdd(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(20,19,31,0.40)] backdrop-blur-sm" onClick={onClose} />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onSubmit={submit}
        className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm border border-[rgba(20,19,31,0.06)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#F4F1FB] hover:text-[#14131F] transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <h2 className="text-[20px] font-semibold text-[#14131F] tracking-tight">Add funds</h2>
        <p className="text-[13px] text-[#565469] mt-1">
          Towards <span className="font-medium text-[#14131F]">{goal.name}</span>
        </p>

        <div className="mt-5 flex items-baseline gap-2 border-b-2 border-[#14131F] py-2">
          <span className="text-[20px] font-medium text-[#565469]">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            placeholder="0"
            className="flex-1 bg-transparent outline-none text-[32px] font-semibold tabular-nums text-[#14131F] placeholder:text-[#C4C2D4]"
          />
        </div>

        <div className="mt-7 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">Add</button>
        </div>
      </motion.form>
    </div>
  )
}
