"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  BrainCircuit,
  Send,
  Trash2,
  Sparkles,
  ChevronDown,
  MessageSquare,
  Search,
  FileText,
  TrendingUp,
} from "lucide-react"
import { ChatMessage, type ChatMessageItem } from "@/components/ai-advisor/ChatMessage"

const STORAGE_KEY = "finpilot-ai-advisor-conversation"

const SUGGESTIONS = [
  { text: "Where am I overspending?", label: "Where am I overspending?", icon: Search },
  { text: "Give me a monthly summary", label: "Monthly summary", icon: FileText },
  { text: "Explain SIP vs FD for me", label: "SIP vs FD", icon: TrendingUp },
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
        className="fp-card px-6 py-5 mb-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[17px] leading-tight text-[#0F0E17]">FinPilot AI Advisor</h1>
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online · Premium Support
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[12px] font-semibold border border-[hsl(var(--border))] text-red-500 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </Button>
      </motion.div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto fp-card p-5 sm:p-7 space-y-5 !shadow-sm relative"
      >
        <AnimatePresence>
          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1]
            const hideAvatar = prevMsg && prevMsg.role === msg.role
            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isUser={msg.role === "user"}
                isLatest={i === messages.length - 1}
                hideAvatar={hideAvatar}
              />
            )
          })}

          {/* Loading indicator */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <BrainCircuit className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <div className="chat-bubble-assistant px-5 py-3.5 flex gap-1.5 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
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
              className="absolute bottom-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center border border-[rgba(0,0,0,0.08)] shadow-sm hover:bg-white transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-[#4B4963]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fp-card p-5 mt-4 space-y-4 !shadow-sm"
      >
        {/* Suggestion chips */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.text}
                onClick={() => sendMessage(s.text)}
                disabled={loading}
                className="suggestion-chip hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Icon className="w-3 h-3 mr-1.5 text-[#8B89A0]" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Input row */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 flex items-start gap-3 bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] rounded-[16px] px-4 py-3.5 relative border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] focus-within:border-[#7C3AED] focus-within:bg-card focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.10)] transition-all">
            <MessageSquare className="w-[18px] h-[18px] mt-0.5 text-[#B8B5C9]" />
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
              placeholder="Ask about mutual funds, salary savings, budgets..."
              disabled={loading}
              rows={1}
              maxLength={1000}
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#A5A3B8] min-w-0 resize-none max-h-[120px] text-[#0F0E17] dark:text-foreground font-medium leading-relaxed"
            />
          </div>

          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all hover:-translate-y-0.5 active:scale-95 border-none p-0"
          >
            <Send className="w-[18px] h-[18px]" />
          </Button>
        </div>

        {error && (
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 mt-2 px-1">{error}</p>
        )}
      </motion.div>
    </div>
  )
}
