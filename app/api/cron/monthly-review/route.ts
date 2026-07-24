import { NextResponse } from "next/server"
import { generateMonthlyReview } from "@/services/ai/monthlyReview"
import { authenticateRequest, safeErrorResponse } from "@/lib/middleware"

export const dynamic = "force-dynamic"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// Triggered by Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set
// as a project env var — set that in Vercel to lock this down. Without it,
// falls back to the same same-origin/dev-only check every other route uses.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    const authError = authenticateRequest(request)
    if (authError) return authError
  }

  try {
    const result = await generateMonthlyReview(currentPeriod(), true)
    return NextResponse.json({ status: "ok", ...result })
  } catch (error) {
    return safeErrorResponse(error, "Failed to generate monthly review")
  }
}
