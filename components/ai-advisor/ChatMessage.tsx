"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export type ChatMessageItem = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

type ChatMessageProps = {
  message: ChatMessageItem
  isUser: boolean
}

export function ChatMessage({ message, isUser }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!navigator?.clipboard) {
      return
    }

    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
          AI
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isUser
              ? "rounded-br-[4px] rounded-bl-3xl rounded-tl-3xl rounded-tr-3xl bg-primary text-primary-foreground"
              : "rounded-bl-[4px] rounded-br-3xl rounded-tl-3xl rounded-tr-3xl bg-slate-900 text-slate-100"
          }`}
        >
          {message.content}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[0.72rem] text-slate-500">
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <Button variant="ghost" size="xs" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      {isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-900">
          You
        </div>
      )}
    </div>
  )
}
