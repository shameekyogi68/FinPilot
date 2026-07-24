import { NextResponse } from "next/server"
import { searchMutualFunds, getMutualFundDetails } from "@/services/market/mfApi"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  const code = searchParams.get("code")

  try {
    if (code) {
      const details = await getMutualFundDetails(code)
      if (!details) {
        return NextResponse.json({ error: "Scheme code not found" }, { status: 444 })
      }
      return NextResponse.json(details)
    }

    if (query) {
      const results = await searchMutualFunds(query)
      return NextResponse.json(results)
    }

    // Default top popular Indian mutual funds schemes
    const popularSchemes = [
      { schemeCode: 122639, schemeName: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth" },
      { schemeCode: 120503, schemeName: "Nippon India Small Cap Fund - Direct Plan - Growth" },
      { schemeCode: 118834, schemeName: "SBI Bluechip Fund - Direct Plan - Growth" },
      { schemeCode: 119062, schemeName: "UTI Nifty 50 Index Fund - Direct Plan - Growth" },
      { schemeCode: 140228, schemeName: "Mirae Asset Large & Midcap Fund - Direct Plan - Growth" },
      { schemeCode: 120716, schemeName: "HDFC Small Cap Fund - Direct Plan - Growth" },
    ]

    return NextResponse.json(popularSchemes)
  } catch (error: any) {
    console.error("Error in mutual funds API:", error)
    return NextResponse.json(
      { error: "Failed to fetch mutual fund market data", details: error?.message },
      { status: 500 }
    )
  }
}
