"use client"

import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { formatCurrency } from "@/lib/utils/currency"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2, Plus, Target, Calendar, Trophy, Edit2, Wallet } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"

type Goal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
}

function RadialProgress({ percent, isComplete }: { percent: number; isComplete: boolean }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const strokeOffset = circ * (1 - percent / 100)

  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,0.06)" strokeWidth="7" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#goalGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className="goal-ring-circle"
        />
        <defs>
          <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isComplete ? (
          <Trophy className="w-5 h-5 text-amber-500" />
        ) : (
          <>
            <span className="text-[16px] font-bold text-[#0F0E17] leading-none">{percent}%</span>
            <span className="text-[9px] font-bold text-[#8B89A0] uppercase tracking-wider mt-0.5">done</span>
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

  const [fundsDialogOpen, setFundsDialogOpen] = useState(false)
  const [activeUpdateGoal, setActiveUpdateGoal] = useState<Goal | null>(null)
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
        body: JSON.stringify({
          name: name.trim(),
          targetAmount: parseFloat(targetAmount),
          currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
          deadline: deadline || null
        }),
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

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUpdateGoal || !addAmount) return
    try {
      const newAmount = activeUpdateGoal.currentAmount + parseFloat(addAmount)
      const res = await fetch(`/api/goals/${activeUpdateGoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newAmount }),
      })
      if (res.ok) {
        const isNowComplete = newAmount >= activeUpdateGoal.targetAmount
        toast.success(isNowComplete ? "Goal achieved! Congratulations! 🎉" : "Funds added! 💰")
        setFundsDialogOpen(false); setActiveUpdateGoal(null); setAddAmount(""); fetchGoals()
      }
    } catch { toast.error("Failed to add funds") }
  }

  const openAddFunds = (goal: Goal) => {
    setActiveUpdateGoal(goal)
    setAddAmount("")
    setFundsDialogOpen(true)
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8 min-h-screen">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between" style={{ animation: "fadeInUp 0.35s ease both" }}>
          <div>
            <h1 className="text-[26px] font-bold text-[#0F0E17] leading-tight tracking-tight">Financial Goals</h1>
            <p className="text-[14px] text-[#8B89A0] mt-1 font-medium">Milestones and targets for wealth building</p>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} strokeWidth={2.5} /> New Goal
          </button>
        </div>

        {/* Goals Stats */}
        {!loading && goals.length > 0 && (
          <div className="fp-card p-6" style={{ animation: "fadeInUp 0.35s ease both", animationDelay: "0.08s" }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-2">Total Goals</p>
                <p className="text-[24px] font-bold text-[#0F0E17] leading-none">{goals.length}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-2">Total Saved</p>
                <p className="text-[24px] font-bold text-emerald-700 leading-none">{formatCurrency(totalSaved, currency)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-2">Total Target</p>
                <p className="text-[24px] font-bold text-[#4B4963] leading-none">{formatCurrency(totalTarget, currency)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B89A0] uppercase mb-2">Overall Progress</p>
                <p className="text-[24px] font-bold text-gradient leading-none">{totalProgress.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="fp-card p-6 min-h-[220px] animate-pulse space-y-4">
                <div className="flex gap-4">
                  <div className="w-[72px] h-[72px] rounded-full bg-[#F5F3FF]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 bg-[#F5F3FF] rounded-full" />
                    <div className="h-3 w-1/2 bg-[#F5F3FF] rounded-full" />
                  </div>
                </div>
                <div className="h-10 w-full bg-[#F5F3FF] rounded-[10px]" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="fp-card p-16 text-center">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4" aria-hidden="true">
              <circle cx="32" cy="32" r="22" fill="#EDE9FE" />
              <circle cx="32" cy="32" r="14" fill="#DDD6FE" />
              <circle cx="32" cy="32" r="5" fill="#7C3AED" />
              <line x1="32" y1="4" x2="32" y2="14" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="32" y1="50" x2="32" y2="60" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <p className="text-[15px] font-medium text-[#0F0E17] mb-1">No goals yet</p>
            <p className="text-[13px] text-[#8B89A0] max-w-sm mx-auto mb-5">
              Start building your financial future. Set your first milestone target.
            </p>
            <button onClick={openCreate} className="btn-primary mx-auto">Create First Goal</button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" style={{ animation: "fadeInUp 0.35s ease both", animationDelay: "0.16s" }}>
            <AnimatePresence>
              {goals.map((goal, idx) => {
                const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
                const isComplete = percent >= 100
                const needed = monthlyNeeded(goal)
                const days = goal.deadline ? daysUntil(goal.deadline) : null

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: idx * 0.05 }}
                    className="fp-card p-6 flex flex-col justify-between min-h-[220px] group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 w-full">
                          <RadialProgress percent={percent} isComplete={isComplete} />
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-start justify-between">
                              <h3 className="font-bold text-[15px] leading-tight text-[#0F0E17] truncate pr-1">
                                {goal.name}
                              </h3>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                <button
                                  onClick={() => openEdit(goal)}
                                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#C4C2D4] hover:text-[#7C3AED] hover:bg-purple-50 transition-colors"
                                  aria-label="Edit Goal"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(goal.id)}
                                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#C4C2D4] hover:text-red-500 hover:bg-red-50 transition-colors"
                                  aria-label="Delete Goal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[13px] font-bold text-[#4B4963] mt-1.5 tabular-nums">
                              {formatCurrency(goal.currentAmount, currency)}{" "}
                              <span className="text-[#B8B5C9] font-medium">/ {formatCurrency(goal.targetAmount, currency)}</span>
                            </p>
                            {goal.deadline && (
                              <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 flex items-center gap-1 ${
                                days !== null && days < 30 ? "text-rose-500" : "text-amber-600"
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {days !== null && days > 0 ? `${days} days left` : "Deadline passed"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {needed !== null && !isComplete && (
                        <div className="text-[10px] font-bold tracking-[0.08em] uppercase px-3 py-2 rounded-xl bg-[rgba(124,58,237,0.05)] text-[#7C3AED] mb-4">
                          Save {formatCurrency(needed, currency)}/month to hit target
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[rgba(0,0,0,0.06)] pt-4 mt-auto">
                      <button
                        onClick={() => openAddFunds(goal)}
                        disabled={isComplete}
                        className="w-full h-10 rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] hover:bg-[#F5F3FF] hover:border-[#EDE9FE] text-[12px] font-bold uppercase tracking-wider text-[#4B4963] hover:text-[#7C3AED] transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" /> {isComplete ? "Goal Achieved!" : "Add Funds"}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Funds Modal Overlay */}
        <Dialog open={fundsDialogOpen} onOpenChange={setFundsDialogOpen}>
          <DialogContent className="modal-content p-7 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F0E17]">Add Saved Funds</h3>
                  <p className="text-[12px] text-[#8B89A0] font-medium">Transfer saved amounts to goal ledger</p>
                </div>
              </div>
            </DialogHeader>
            {activeUpdateGoal && (
              <form onSubmit={handleAddFunds} className="space-y-5 mt-4">
                <div>
                  <Label htmlFor="fm-amount" className="label-premium">Amount</Label>
                  <div className="flex rounded-[14px] border-[1.5px] border-[rgba(0,0,0,0.10)] overflow-hidden focus-within:border-[#7C3AED] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.12)] transition-all bg-[rgba(255,255,255,0.70)]">
                    <div className="w-14 flex items-center justify-center text-[18px] font-bold text-[#8B89A0] border-r border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)] flex-shrink-0">
                      ₹
                    </div>
                    <input
                      id="fm-amount"
                      type="number"
                      step="1"
                      required
                      placeholder="e.g. 5000"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="flex-1 h-[48px] px-4 text-[16px] font-bold text-[#0F0E17] bg-transparent outline-none border-none focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setFundsDialogOpen(false); setActiveUpdateGoal(null) }}
                    className="btn-secondary !h-10 !px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !h-10 !px-4"
                  >
                    Save Funds
                  </button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Goal Dialog Form */}
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditId(null) }}>
          <DialogContent className="modal-content p-7 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F0E17]">
                    {editId ? "Edit Milestone Goal" : "Create Milestone Goal"}
                  </h3>
                  <p className="text-[12px] text-[#8B89A0] font-medium">Define your wealth building target</p>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 mt-4">
              <div>
                <Label htmlFor="goal-name" className="label-premium">Goal Name</Label>
                <input
                  id="goal-name"
                  type="text"
                  required
                  placeholder="e.g. Europe Vacation, MacBook Pro..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="custom-input !h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal-target" className="label-premium">Target</Label>
                  <div className="flex rounded-[14px] border-[1.5px] border-[rgba(0,0,0,0.10)] overflow-hidden focus-within:border-[#7C3AED] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.12)] transition-all bg-[rgba(255,255,255,0.70)]">
                    <div className="w-10 flex items-center justify-center text-[15px] font-bold text-[#8B89A0] border-r border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)] flex-shrink-0">
                      ₹
                    </div>
                    <input
                      id="goal-target"
                      type="number"
                      step="1"
                      required
                      placeholder="50000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="flex-1 h-[42px] px-3 text-[14px] font-bold text-[#0F0E17] bg-transparent outline-none border-none focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="goal-current" className="label-premium">Saved Already</Label>
                  <div className="flex rounded-[14px] border-[1.5px] border-[rgba(0,0,0,0.10)] overflow-hidden focus-within:border-[#7C3AED] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.12)] transition-all bg-[rgba(255,255,255,0.70)]">
                    <div className="w-10 flex items-center justify-center text-[15px] font-bold text-[#8B89A0] border-r border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.02)] flex-shrink-0">
                      ₹
                    </div>
                    <input
                      id="goal-current"
                      type="number"
                      step="1"
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="flex-1 h-[42px] px-3 text-[14px] font-bold text-[#0F0E17] bg-transparent outline-none border-none focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="goal-deadline" className="label-premium">Target Date <span className="text-[#8B89A0] font-normal">(Optional)</span></Label>
                <input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="custom-input !h-11"
                />
              </div>
              <DialogFooter className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary !h-10 !px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary !h-10 !px-4"
                >
                  {editId ? "Update Goal" : "Save Goal"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="modal-content p-7">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[16px] font-bold text-[#0F0E17]">Delete Goal</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-[#4B4963]">
                Are you sure you want to delete this financial goal? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="btn-secondary !h-10 !px-4 border-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="btn-primary !h-10 !px-4 bg-[#ef4444] hover:bg-[#b91c1c] text-white">
                Delete Goal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}
