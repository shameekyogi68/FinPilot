"use client"

import { useState } from "react"
import { Sparkles, Send, X, Bot } from "lucide-react"

export function FloatingAIWealthOfficer() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Greetings! I am your Autonomous Personal AI Wealth Manager. How can I direct your investments, spending limits, or mutual fund allocations today?",
    },
  ])
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I encountered a minor bump analyzing your data. Please try asking again.",
          },
        ])
      }
    } catch (e) {
      console.error("Floating AI chat error", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-[#090A0F] via-[#12151E] to-[#1A1D2B] border border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.3)] text-white flex items-center gap-2.5 hover:scale-105 transition-transform"
        >
          <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-[13.5px] font-bold text-white pr-1">AI Wealth Manager</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[520px] bg-[#090A0F] border border-emerald-500/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-white flex flex-col overflow-hidden animate-in">
          {/* Header */}
          <div className="p-4 bg-[#12151E] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white">AI Wealth Officer</h3>
                <span className="text-[10px] text-emerald-400 font-semibold block">
                  Autonomous Multi-Model Consensus Active
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-[13px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl ${
                  m.role === "user"
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-white ml-8"
                    : "bg-white/5 border border-white/10 text-white/90 mr-8 leading-relaxed"
                }`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 animate-pulse text-[12px]">
                Autonomous AI Wealth Committee is evaluating market & portfolio metrics…
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#12151E] border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask wealth advice or expense checks…"
              className="flex-1 px-3.5 py-2 bg-black/50 border border-white/15 rounded-xl text-[13px] text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold hover:bg-emerald-400 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
