import { NextResponse } from "next/server"
import { z } from "zod"
import { advisorChat } from "../../../services/ai/advisorChat"

const messageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(500, "Message must be 500 characters or fewer"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .optional(),
})

const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS = 10

type ChatRateLimitStore = {
  __chatRateLimits?: Map<string, { count: number; windowStart: number }>
}

const getRateLimiter = () => {
  const globalState = globalThis as unknown as ChatRateLimitStore
  if (!globalState.__chatRateLimits) {
    globalState.__chatRateLimits = new Map<string, { count: number; windowStart: number }>()
  }
  return globalState.__chatRateLimits
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "global"
  const limiter = getRateLimiter()
  const now = Date.now()
  const entry = limiter.get(ip) ?? { count: 0, windowStart: now }

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0
    entry.windowStart = now
  }

  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  entry.count += 1
  limiter.set(ip, entry)

  const body = await request.json().catch(() => null)
  const parseResult = messageSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    )
  }

  try {
    const response = await advisorChat(parseResult.data.message, parseResult.data.history ?? [])
    return NextResponse.json({ response })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate AI response" },
      { status: 500 }
    )
  }
}
