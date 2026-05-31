import { NextResponse } from "next/server"
import { generateMonthlyInsights } from "@/services/ai/monthlyInsights"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const month = url.searchParams.get("month")
  const refresh = url.searchParams.get("refresh") === "true"

  if (!month) {
    return NextResponse.json({ error: "Missing month" }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month format" }, { status: 400 })
  }

  try {
    const result = await generateMonthlyInsights(month, refresh)

    return NextResponse.json(
      { insights: result.insights, updatedAt: result.updatedAt },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load insights" },
      { status: 500 }
    )
  }
}
