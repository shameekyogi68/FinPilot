"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react"
import { inr } from "@/lib/utils/format"
import type { DashboardMetrics } from "@/lib/queries/dashboardQueries"
import type { RunwayMetrics } from "@/lib/queries/runwayQueries"
import { toast } from "sonner"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

const SUGGESTIONS = [
  "How can I save more this month?",
  "Am I on track with my budgets?",
  "Am I saving enough given how irregular my income is?",
  "What's my safety buffer situation?",
]

export function AdvisorClient({
  initialMessages,
  metrics,
  runway,
}: {
  initialMessages: ChatMessage[]
  metrics: DashboardMetrics
  runway: RunwayMetrics
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, sending])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setInput("")
    setSending(true)
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to reach the advisor")
        return
      }
      const reply: ChatMessage = {
        id: `a${Date.now()}`,
        role: "assistant",
        content: json.response,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, reply])
    } catch {
      toast.error("Unable to reach the advisor")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5 h-[calc(100vh-160px)]">
      {/* Chat panel */}
      <div className="surface-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgba(20,19,31,0.06)] flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A48FF6] to-[#6D55E3] flex items-center justify-center">
            <Sparkles size={18} strokeWidth={2} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#14131F]">Runway Advisor</p>
            <p className="text-[11.5px] text-[#8C8AA0] mt-0.5">Grounded in your real transactions, budgets, and goals</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A48FF6] to-[#6D55E3] flex items-center justify-center flex-shrink-0">
                  <Bot size={14} strokeWidth={2} className="text-white" />
                </div>
              )}
              <div className={`${m.role === "user" ? "chat-user" : "chat-ai"}`}>
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-[#14131F] flex items-center justify-center flex-shrink-0">
                  <UserIcon size={14} strokeWidth={2} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A48FF6] to-[#6D55E3] flex items-center justify-center flex-shrink-0">
                <Bot size={14} strokeWidth={2} className="text-white" />
              </div>
              <div className="chat-ai flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D55E3] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D55E3] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D55E3] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="border-t border-[rgba(20,19,31,0.06)] p-4 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your money…"
              className="field flex-1"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary !h-11 !w-11 !p-0"
              aria-label="Send"
            >
              <Send size={15} strokeWidth={1.75} />
            </button>
          </div>
        </form>
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        {/* Quick context */}
        <div className="surface-card p-5">
          <p className="section-title mb-3">Your snapshot</p>
          <div className="space-y-3 text-[13px]">
            <Row label="Balance" value={inr(metrics.currentBalance)} />
            <Row label="Income (MTD)" value={inr(metrics.monthlyIncome)} tone="gain" />
            <Row label="Expenses (MTD)" value={inr(metrics.monthlyExpense)} />
            <Row label="Savings rate" value={`${(metrics.savingsRate * 100).toFixed(0)}%`} tone="brand" />
            <Row
              label="Runway"
              value={runway.runwayMonths !== null ? `${runway.runwayMonths.toFixed(1)} mo` : "—"}
              tone="brand"
            />
          </div>
        </div>

        {/* Suggestions */}
        <div className="surface-card p-5">
          <p className="section-title mb-3">Try asking</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={sending}
                className="text-left p-3 rounded-xl bg-[#FAFAF7] hover:bg-[#F4F1FB] border border-[rgba(20,19,31,0.06)] text-[12.5px] text-[#14131F] hover:border-[rgba(109,85,227,0.25)] transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" | "brand" }) {
  const c = tone === "gain" ? "text-[#0E8A5F]" : tone === "brand" ? "text-gradient" : "text-[#14131F]"
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#565469]">{label}</span>
      <span className={`font-semibold tabular-nums ${c}`}>{value}</span>
    </div>
  )
}
