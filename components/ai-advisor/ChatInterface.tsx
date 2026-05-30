"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChatMessage, type ChatMessageItem } from "@/components/ai-advisor/ChatMessage"

const STORAGE_KEY = "finpilot-ai-advisor-conversation"
const SUGGESTIONS = [
  "How can I save more money?",
  "Where am I overspending?",
  "Am I on track with my budget?",
  "What were my biggest expenses?",
  "Give me a monthly summary",
]

const createWelcomeMessage = (): ChatMessageItem => ({
  id: "welcome",
  role: "assistant",
  content: "🤖 Hey! I'm FinPilot. Ask me about your spending, budgets, or savings goals.",
  timestamp: new Date().toISOString(),
})

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessageItem[]
        setMessages(parsed.length ? parsed.slice(-20) : [createWelcomeMessage()])
      } else {
        setMessages([createWelcomeMessage()])
      }
    } catch {
      setMessages([createWelcomeMessage()])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const history = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [messages]
  )

  const sendMessage = async (content: string) => {
    if (!content.trim()) {
      return
    }

    setError(null)
    const userMessage: ChatMessageItem = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Unable to get a response")
      }

      const aiMessage: ChatMessageItem = {
        id: crypto.randomUUID?.() ?? String(Date.now() + 1),
        role: "assistant",
        content: payload.response,
        timestamp: new Date().toISOString(),
      }

      setMessages((current) => [...current, aiMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message")
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => sendMessage(input)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    const welcome = createWelcomeMessage()
    setMessages([welcome])
    setError(null)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]))
  }

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>AI Advisor Chat</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ask FinPilot for budget, spending, and savings guidance.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat}>
            Clear chat
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex h-[500px] flex-col gap-4 p-0">
        <div className="flex-1 overflow-hidden p-4">
          <div className="flex h-full flex-col gap-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} isUser={message.role === "user"} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border bg-background p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                size="sm"
                onClick={() => sendMessage(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
              className="min-w-0"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? "Thinking…" : "Send"}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
