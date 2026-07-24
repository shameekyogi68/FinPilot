import { NextResponse } from "next/server"
import { fetchMutualFundHistory } from "@/lib/services/marketData"
import { historicalCagr } from "@/lib/utils/finance"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const schemeCode = url.searchParams.get("schemeCode")?.trim()

  if (!schemeCode) {
    return NextResponse.json({ error: "Missing schemeCode" }, { status: 400 })
  }

  try {
    const fund = await fetchMutualFundHistory(schemeCode)
    const latest = fund.history[0]

    return NextResponse.json({
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName,
      fundHouse: fund.fundHouse,
      category: fund.category,
      latestNav: latest.nav,
      asOf: latest.date.toISOString(),
      cagr1y: historicalCagr(fund.history, 1),
      cagr3y: historicalCagr(fund.history, 3),
      cagr5y: historicalCagr(fund.history, 5),
    })
  } catch (error) {
    return safeErrorResponse(error, "Failed to load fund performance")
  }
}
