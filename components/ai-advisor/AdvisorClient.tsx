"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react"
import { inr } from "@/lib/utils/format"
import type { DashboardMetrics } from "@/lib/queries/dashboardQueries"
import type { RunwayMetrics } from "@/lib/queries/runwayQueries"
import { AiMarkdown } from "@/components/ui/ai-markdown"
import { toast } from "sonner"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

const SUGGESTIONS = [
  "What is my safe daily spending limit today?",
  "Which Mutual Funds should I invest in this month?",
  "How should I rebalance my Equity vs Debt allocation?",
  "Generate my step-by-step monthly wealth allocation plan.",
  "Am I on track with my safety buffer and emergency fund?",
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
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles size={18} strokeWidth={2} className="text-black" />
          </div>
          <div className="flex-1">
            <p className="text-[14.5px] font-extrabold text-white">Yogi&apos;s Wealth AI Advisor</p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Shameek Yogi&apos;s Autonomous Private Wealth Intelligence Engine</p>
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot size={14} strokeWidth={2} className="text-black font-bold" />
                </div>
              )}
              <div className={`${m.role === "user" ? "chat-user" : "chat-ai"}`}>
                {m.role === "assistant" ? (
                  <AiMarkdown content={m.content} className="text-[13.5px] leading-relaxed" />
                ) : (
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={14} strokeWidth={2} className="text-emerald-400" />
                </div>
              )}
            </motion.div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot size={14} strokeWidth={2} className="text-black font-bold" />
              </div>
              <div className="chat-ai flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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
              label="Safety Buffer"
              value={runway.runwayMonths !== null ? `${runway.runwayMonths.toFixed(1)} mo` : "—"}
              tone="brand"
            />
          </div>
        </div>

        {/* Suggestions */}
        <div className="surface-card p-5">
          <p className="section-title mb-3 text-slate-400">Try asking</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={sending}
                className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[12.5px] text-white hover:border-emerald-500/30 transition-all"
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
  const c = tone === "gain" ? "text-emerald-400" : tone === "brand" ? "text-gradient" : "text-white"
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold tabular-nums ${c}`}>{value}</span>
    </div>
  )
}
