"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  BrainCircuit,
  Send,
  Trash2,
  Sparkles,
  User,
  ChevronDown,
} from "lucide-react"
import { ChatMessage, type ChatMessageItem } from "@/components/ai-advisor/ChatMessage"

const STORAGE_KEY = "finpilot-ai-advisor-conversation"

const SUGGESTIONS = [
  "How can I save more money?",
  "Where am I overspending?",
  "Am I on track with my budget?",
  "What were my biggest expenses?",
  "Give me a monthly summary",
  "How should I invest my savings?",
  "Explain SIP vs FD for me",
  "How much should I keep as emergency fund?",
]

const createWelcomeMessage = (): ChatMessageItem => ({
  id: "welcome",
  role: "assistant",
  content:
    "Namaste! I'm FinPilot, your elite personal wealth advisor. I have full context of your transactions, budgets, and financial goals. Ask me anything about your spending, saving strategies, SIPs, FDs, or tax planning — I'm here to help you build lasting wealth.",
  timestamp: new Date().toISOString(),
})

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessageItem[]
        setMessages(parsed.length ? parsed.slice(-30) : [createWelcomeMessage()])
      } else {
        setMessages([createWelcomeMessage()])
      }
    } catch {
      setMessages([createWelcomeMessage()])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setShowScrollDown(!isNearBottom)
  }

  const history = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    [messages]
  )

  const sendMessage = async (content: string) => {
    if (!content.trim()) return
    setError(null)

    const userMsg: ChatMessageItem = {
      id: crypto.randomUUID?.() ?? String(Math.random()),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((cur) => [...cur, userMsg])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Unable to get a response")

      const aiMsg: ChatMessageItem = {
        id: crypto.randomUUID?.() ?? String(Date.now() + 1),
        role: "assistant",
        content: payload.response,
        timestamp: new Date().toISOString(),
      }

      setMessages((cur) => [...cur, aiMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message")
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const clearChat = () => {
    const welcome = createWelcomeMessage()
    setMessages([welcome])
    setError(null)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl px-5 py-4 mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[hsl(var(--primary))]" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[hsl(var(--income))] rounded-full border-2 border-card" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-jakarta font-semibold text-base leading-tight text-foreground">FinPilot AI Advisor</h1>
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            </div>
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(var(--income))]">● Online · Free forever</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground hover:text-[hsl(var(--destructive))] hover:bg-[var(--expense-bg)] rounded-xl"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </Button>
      </motion.div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-4 sm:p-6 space-y-4 relative"
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isUser={msg.role === "user"}
              isLatest={i === messages.length - 1}
            />
          ))}

          {/* Loading indicator */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <div className="w-7 h-7 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                <BrainCircuit className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              </div>
              <div className="bg-[hsl(var(--muted))] px-4 py-3 rounded-xl border-[hsl(var(--border))]">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="typing-dot bg-[hsl(var(--primary))]" />
                  <span className="typing-dot bg-[hsl(var(--primary))]" />
                  <span className="typing-dot bg-[hsl(var(--primary))]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollDown && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 w-8 h-8 bg-[hsl(var(--muted))] rounded-full flex items-center justify-center border border-[hsl(var(--border))]"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.04)] rounded-2xl p-4 mt-4"
      >
        {/* Suggestion chips */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap mb-3 pb-1">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="text-[10px] font-semibold tracking-[0.1em] px-3 py-1.5 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-foreground hover:bg-[hsl(var(--border))] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex items-start gap-2 bg-[hsl(var(--muted))] rounded-xl px-3 py-2.5 relative border-[hsl(var(--border))]">
            <User className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                  if (inputRef.current) inputRef.current.style.height = "auto"
                }
              }}
              placeholder="Ask about your finances, SIPs, budgets..."
              disabled={loading}
              rows={1}
              maxLength={1000}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 min-w-0 resize-none max-h-[120px] text-foreground"
            />
            <span className="absolute bottom-1 right-2 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/40 pointer-events-none">
              {input.length}/1000
            </span>
          </div>

          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="rounded-xl px-4 h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--destructive))] mt-2 px-1">{error}</p>
        )}
      </motion.div>
    </div>
  )
}
