import { NextResponse } from "next/server"
import { getDailyWealthPulse } from "@/services/ai/wealthManagerEngine"

export async function GET() {
  try {
    const pulse = await getDailyWealthPulse()
    return NextResponse.json(pulse)
  } catch (error: any) {
    console.error("Error fetching daily wealth pulse:", error)
    return NextResponse.json(
      { error: "Failed to compute daily wealth pulse", details: error?.message },
      { status: 500 }
    )
  }
}
