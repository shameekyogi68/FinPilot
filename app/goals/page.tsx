"use client"

import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Trash2, TrendingUp, Plus, Target, Calendar, Sparkles, Trophy, Edit2, PieChart } from "lucide-react"
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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">Financial Goals</span>
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Track your <span className="text-[hsl(var(--primary))]">milestones</span>
              </h1>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditId(null) }}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-jakarta font-semibold text-foreground">
                    <Target className="w-4 h-4 text-[hsl(var(--primary))]" /> {editId ? "Edit Goal" : "Create New Goal"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-name" className="text-sm text-muted-foreground">Goal Name</Label>
                    <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund, New Laptop, Trip to Goa" required className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="goal-target" className="text-sm text-muted-foreground">Target Amount (₹)</Label>
                      <Input id="goal-target" type="number" step="1" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" placeholder="50000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="goal-current" className="text-sm text-muted-foreground">Already Saved (₹)</Label>
                      <Input id="goal-current" type="number" step="1" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-deadline" className="text-sm text-muted-foreground">Target Date (Optional)</Label>
                    <Input id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-[hsl(var(--muted))] border-[hsl(var(--border))]" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 rounded-xl">
                      {editId ? "Update Goal" : "Save Goal"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Overview Stats */}
          {!loading && goals.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1">Total Goals</p>
                  <p className="font-sora text-xl font-semibold text-foreground">{goals.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1">Total Saved</p>
                  <p className="font-sora text-xl font-semibold text-[hsl(var(--income))]">{formatCurrency(totalSaved, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1">Total Target</p>
                  <p className="font-sora text-xl font-semibold text-muted-foreground">{formatCurrency(totalTarget, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1">Overall Progress</p>
                  <div className="flex items-center gap-2">
                    <p className="font-sora text-xl font-semibold text-[hsl(var(--primary))]">{totalProgress.toFixed(1)}%</p>
                    <PieChart className="w-5 h-5 text-[hsl(var(--primary))]/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-jakarta font-semibold text-foreground">Delete Goal</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to delete this goal? This action cannot be undone and your progress tracking for this goal will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-muted-foreground hover:text-foreground rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90 rounded-xl">
                  Delete Goal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Goals Grid */}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-5 h-56 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-full bg-[hsl(var(--border))]" />
                    <div className="flex-1 space-y-1 pt-2">
                      <div className="h-4 w-2/3 rounded bg-[hsl(var(--border))]" />
                      <div className="h-3 w-1/2 rounded bg-[hsl(var(--border))]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-16 text-center border-dashed border-[hsl(var(--border-strong))]"
            >
              <div className="mx-auto w-16 h-16 bg-[hsl(var(--muted))] rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-[hsl(var(--primary))]" />
              </div>
              <h3 className="font-jakarta font-semibold text-lg mb-2 text-foreground">No goals yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Start building your financial future. Set your first goal — an emergency fund, a trip, or a new asset.
              </p>
              <Button onClick={openCreate} className="rounded-xl">Create First Goal</Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
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
                        hidden: { opacity: 0, scale: 0.95, y: 16 },
                        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
                      }}
                      className={`group bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-5 relative overflow-hidden`}
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
      </div>
    </ErrorBoundary>
  )
}
