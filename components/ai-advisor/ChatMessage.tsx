"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BrainCircuit, Copy, Check, User } from "lucide-react"

export type ChatMessageItem = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

type ChatMessageProps = {
  message: ChatMessageItem
  isUser: boolean
  isLatest?: boolean
  hideAvatar?: boolean
}

export function ChatMessage({ message, isUser, hideAvatar = false }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!navigator?.clipboard) return
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const timeStr = new Date(message.timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`group flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!hideAvatar ? (
        <div
          className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-gray-100 to-gray-200"
              : "bg-gradient-to-br from-purple-50 to-purple-100"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-[#4B4963]" />
          ) : (
            <BrainCircuit className="w-4 h-4 text-[#7C3AED]" />
          )}
        </div>
      ) : (
        <div className="w-8 h-8 flex-shrink-0" />
      )}

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-5 py-3.5 text-[13.5px] leading-relaxed font-medium ${
            isUser ? "chat-bubble-user" : "chat-bubble-assistant text-foreground"
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp + copy */}
        <div
          className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/60">{timeStr}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-2.5 h-2.5 text-[hsl(var(--income))]" />
                  <span className="text-[hsl(var(--income))]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-2.5 h-2.5" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
