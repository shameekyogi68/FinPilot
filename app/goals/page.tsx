"use client"

import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Trash2, Plus, Target, Calendar, Trophy, Edit2, PieChart } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"

type Goal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
}

const GOAL_ACCENT_COLORS = [
  { ring: "stroke-[hsl(var(--primary))]", fill: "bg-[hsl(var(--primary))]", text: "text-[hsl(var(--primary))]", light: "bg-[hsl(var(--muted))]" },
  { ring: "stroke-[hsl(var(--income))]", fill: "bg-[hsl(var(--income))]", text: "text-[hsl(var(--income))]", light: "bg-[var(--income-bg)]" },
  { ring: "stroke-[hsl(var(--warning))]", fill: "bg-[hsl(var(--warning))]", text: "text-[hsl(var(--warning))]", light: "bg-[var(--warning-bg)]" },
  { ring: "stroke-[hsl(var(--expense))]", fill: "bg-[hsl(var(--destructive))]", text: "text-[hsl(var(--destructive))]", light: "bg-[var(--expense-bg)]" },
]

function RadialProgress({ percent, color, isComplete }: { percent: number; color: typeof GOAL_ACCENT_COLORS[0]; isComplete: boolean }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const stroke = circ * (1 - percent / 100)

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className={color.ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: stroke }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isComplete ? (
          <Trophy className="w-6 h-6 text-[hsl(var(--warning))]" />
        ) : (
          <>
            <span className="font-sora text-lg font-semibold leading-none">{percent}%</span>
            <span className="text-[9px] text-muted-foreground font-medium">done</span>
          </>
        )}
      </div>
    </div>
  )
}

function daysUntil(deadline: string): number {
  const diff = new Date(deadline).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function monthlyNeeded(goal: Goal): number | null {
  if (!goal.deadline) return null
  const remaining = goal.targetAmount - goal.currentAmount
  const days = daysUntil(goal.deadline)
  if (days <= 0) return null
  const months = Math.max(1, Math.ceil(days / 30))
  return remaining / months
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useProfile()
  const currency = profile?.currency ?? "INR"

  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("")
  const [deadline, setDeadline] = useState("")

  const [updateId, setUpdateId] = useState<string | null>(null)
  const [addAmount, setAddAmount] = useState("")

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals")
      if (res.ok) setGoals(await res.json())
    } catch { toast.error("Failed to load goals") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGoals() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editId ? `/api/goals/${editId}` : "/api/goals"
      const method = editId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, targetAmount: parseFloat(targetAmount), currentAmount: currentAmount ? parseFloat(currentAmount) : 0, deadline: deadline || null }),
      })
      if (res.ok) {
        toast.success(editId ? "Goal updated! ✨" : "Goal created! 🎯")
        setIsOpen(false); setEditId(null); setName(""); setTargetAmount(""); setCurrentAmount(""); setDeadline("")
        fetchGoals()
      } else toast.error(editId ? "Failed to update goal" : "Failed to create goal")
    } catch { toast.error("An error occurred") }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/goals/${deleteId}`, { method: "DELETE" })
      if (res.ok) { toast.success("Goal deleted"); fetchGoals(); setDeleteId(null) }
    } catch { toast.error("Failed to delete goal") }
  }

  const openEdit = (goal: Goal) => {
    setName(goal.name)
    setTargetAmount(goal.targetAmount.toString())
    setCurrentAmount(goal.currentAmount.toString())
    setDeadline(goal.deadline ? goal.deadline.split("T")[0] : "")
    setEditId(goal.id)
    setIsOpen(true)
  }

  const openCreate = () => {
    setEditId(null); setName(""); setTargetAmount(""); setCurrentAmount(""); setDeadline("")
    setIsOpen(true)
  }

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const handleAddFunds = async (e: React.FormEvent, goal: Goal) => {
    e.preventDefault()
    if (!addAmount) return
    try {
      const newAmount = goal.currentAmount + parseFloat(addAmount)
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newAmount }),
      })
      if (res.ok) {
        const isNowComplete = newAmount >= goal.targetAmount
        toast.success(isNowComplete ? "Goal achieved! Congratulations!" : "Funds added!")
        setUpdateId(null); setAddAmount(""); fetchGoals()
      }
    } catch { toast.error("Failed to add funds") }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen space-y-6">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-[22px] font-medium text-[#0F0E17] leading-tight">Financial Goals</h1>
              <p className="text-[14px] text-[#8B89A0] mt-0.5">Track milestones toward your financial future</p>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditId(null) }}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreate}
                  variant="outline"
                  className="gap-1.5 h-9 px-3 rounded-[10px] border-[rgba(124,58,237,0.3)] text-[#7C3AED] text-[13px] font-medium hover:bg-[#F5F3FF] hover:border-[#7C3AED] transition-all duration-150"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] sm:max-w-md" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)" }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-[16px] font-medium text-[#0F0E17]">
                    <Target size={16} strokeWidth={1.5} className="text-[#7C3AED]" /> {editId ? "Edit Goal" : "Create New Goal"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="goal-name" className="block text-[12px] font-medium text-[#4B4963]">Goal Name</label>
                    <input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund, New Laptop, Trip to Goa" required className="w-full h-11 px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.10)] text-[15px] text-[#0F0E17] bg-white outline-none transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="goal-target" className="block text-[12px] font-medium text-[#4B4963]">Target Amount (₹)</label>
                      <input id="goal-target" type="number" step="1" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required className="w-full h-11 px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.10)] text-[15px] text-[#0F0E17] bg-white outline-none transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]" placeholder="50000" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="goal-current" className="block text-[12px] font-medium text-[#4B4963]">Already Saved (₹)</label>
                      <input id="goal-current" type="number" step="1" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="w-full h-11 px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.10)] text-[15px] text-[#0F0E17] bg-white outline-none transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]" placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="goal-deadline" className="block text-[12px] font-medium text-[#4B4963]">Target Date <span className="text-[#8B89A0] font-normal">(Optional)</span></label>
                    <input id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full h-11 px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.10)] text-[15px] text-[#0F0E17] bg-white outline-none transition-all duration-150 focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[rgba(124,58,237,0.18)]" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 h-12 rounded-[10px] bg-[#7C3AED] text-white text-[15px] font-medium hover:bg-[#6D28D9] transition-colors">
                      {editId ? "Update Goal" : "Save Goal"}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Overview Stats */}
          {!loading && goals.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="fp-card p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="label-xs text-[#8B89A0] mb-1">Total Goals</p>
                  <p className="metric-value text-[#0F0E17] tabular-nums">{goals.length}</p>
                </div>
                <div>
                  <p className="label-xs text-[#8B89A0] mb-1">Total Saved</p>
                  <p className="metric-value text-[#059669] tabular-nums">{formatCurrency(totalSaved, currency)}</p>
                </div>
                <div>
                  <p className="label-xs text-[#8B89A0] mb-1">Total Target</p>
                  <p className="metric-value text-[#4B4963] tabular-nums">{formatCurrency(totalTarget, currency)}</p>
                </div>
                <div>
                  <p className="label-xs text-[#8B89A0] mb-1">Overall Progress</p>
                  <div className="flex items-center gap-2">
                    <p className="metric-value text-[#7C3AED] tabular-nums">{totalProgress.toFixed(1)}%</p>
                    <PieChart size={16} strokeWidth={1.5} className="text-[#C4B5FD]" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)]" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)" }}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[16px] font-medium text-[#0F0E17]">Delete Goal</AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] text-[#4B4963]">
                  Are you sure you want to delete this goal? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-[10px] border-[rgba(0,0,0,0.10)] text-[#4B4963] hover:bg-[#F8F7FF]">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-[10px] bg-[#DC2626] text-white hover:bg-[#b91c1c]">
                  Delete Goal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Goals Grid */}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="fp-card p-5 h-48 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-[40px] h-[40px] rounded-[10px] bg-[#F8F7FF] flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-2/3 rounded-full bg-[#F8F7FF]" />
                      <div className="h-3 w-1/2 rounded-full bg-[#F8F7FF]" />
                    </div>
                  </div>
                  <div className="mt-5 h-1.5 w-full rounded-full bg-[#F8F7FF]" />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fp-card p-16 text-center"
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
                <circle cx="32" cy="32" r="22" fill="#EDE9FE" />
                <circle cx="32" cy="32" r="14" fill="#DDD6FE" />
                <circle cx="32" cy="32" r="5" fill="#7C3AED" />
                <line x1="32" y1="4" x2="32" y2="14" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="32" y1="50" x2="32" y2="60" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <p className="text-[15px] font-medium text-[#0F0E17] mb-1">No goals yet</p>
              <p className="text-[13px] text-[#8B89A0] max-w-sm mx-auto mb-5">
                Start building your financial future. Set your first goal.
              </p>
              <button onClick={openCreate} className="h-10 px-5 rounded-[10px] bg-[#7C3AED] text-white text-[14px] font-medium hover:bg-[#6D28D9] transition-colors">Create First Goal</button>
            </motion.div>
          ) : (
            <motion.div
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            >
              <AnimatePresence>
                {goals.map((goal, idx) => {
                  const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                  const isComplete = percent >= 100
                  const accent = GOAL_ACCENT_COLORS[idx % GOAL_ACCENT_COLORS.length]
                  const needed = monthlyNeeded(goal)
                  const days = goal.deadline ? daysUntil(goal.deadline) : null

                  return (
                    <motion.div
                      key={goal.id}
                      variants={{
                        hidden: { opacity: 0, scale: 0.98, y: 12 },
                        show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const } },
                      }}
                      className="fp-card p-5 relative overflow-hidden group"
                      style={{ borderRadius: "20px" }}
                    >
                      {isComplete && (
                        <div className="absolute top-0 right-0 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-semibold tracking-[0.1em] uppercase py-1 px-3 rounded-bl-xl z-10">
                          ✓ Achieved
                        </div>
                      )}

                      {/* Top row */}
                      <div className="flex items-start gap-4 mb-5">
                        <RadialProgress percent={percent} color={accent} isComplete={isComplete} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3 className="font-jakarta font-semibold text-base leading-tight truncate pr-2 text-foreground">{goal.name}</h3>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(goal)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] rounded-xl"
                                aria-label="Edit goal"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(goal.id)}
                                className="text-muted-foreground hover:text-[hsl(var(--destructive))] transition-colors p-1 flex-shrink-0 bg-[hsl(var(--muted))] hover:bg-[var(--expense-bg)] rounded-xl"
                                aria-label="Delete goal"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="font-sora text-sm font-semibold mt-1 text-foreground">
                            {formatCurrency(goal.currentAmount, currency)}
                            <span className="text-[10px] font-normal text-muted-foreground ml-1">
                              / {formatCurrency(goal.targetAmount, currency)}
                            </span>
                          </p>
                          {days !== null && (
                            <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase ${days < 30 ? "text-[hsl(var(--destructive))]" : "text-muted-foreground"}`}>
                              <Calendar className="w-3 h-3" />
                              {days > 0 ? `${days} days left` : "Deadline passed"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Monthly needed */}
                      {needed !== null && !isComplete && (
                        <div className={`text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-2 rounded-xl ${accent.light} ${accent.text} mb-4`}>
                          Save {formatCurrency(needed, currency)}/month to hit this goal
                        </div>
                      )}

                      {/* Add funds */}
                      <div className="border-t border-[hsl(var(--border))] pt-4">
                        {updateId === goal.id ? (
                          <form onSubmit={(e) => handleAddFunds(e, goal)} className="flex gap-2">
                            <Input
                              type="number"
                              step="1"
                              placeholder="Amount (₹)"
                              value={addAmount}
                              onChange={(e) => setAddAmount(e.target.value)}
                              className="h-8 text-sm bg-[hsl(var(--muted))] border-[hsl(var(--border))] flex-1"
                              autoFocus
                            />
                            <Button type="submit" size="sm" className="h-8 px-3 text-[10px] font-semibold tracking-[0.1em] uppercase rounded-xl">Add</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setUpdateId(null)} className="h-8 px-2 text-[10px] font-semibold tracking-[0.1em] uppercase rounded-xl">✕</Button>
                          </form>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full rounded-xl text-[10px] font-semibold tracking-[0.1em] uppercase h-8 border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))]"
                            onClick={() => { setUpdateId(goal.id); setAddAmount("") }}
                            disabled={isComplete}
                          >
                            {isComplete ? "Goal Completed!" : "+ Add Funds"}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
      </div>
    </ErrorBoundary>
  )
}
