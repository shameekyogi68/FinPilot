import { NextResponse } from "next/server"
import { getRunwayMetrics } from "@/lib/queries/runwayQueries"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const runway = await getRunwayMetrics()
    return NextResponse.json(runway)
  } catch (error) {
    return safeErrorResponse(error, "Failed to load runway metrics")
  }
}
