import { NextResponse } from "next/server"
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth"
import { checkRateLimit } from "@/lib/middleware"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  // Tight limit — this endpoint is intentionally public (no session yet), so it's the one
  // surface a password-guesser could hit directly.
  const rateLimitError = checkRateLimit(request, 10, 60_000)
  if (rateLimitError) return rateLimitError

  if (!process.env.SITE_PASSWORD || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Server is not configured — SITE_PASSWORD and AUTH_SECRET must be set" },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === "string" ? body.password : ""

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  const token = await createSessionToken()
  const res = NextResponse.json({ status: "ok" })
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}
