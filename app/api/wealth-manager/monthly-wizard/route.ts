import { NextResponse } from "next/server"
import { generateMonthlyWizardPlan } from "@/services/ai/wealthManagerEngine"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const customIncome = body.income ? parseFloat(body.income) : undefined

    const plan = await generateMonthlyWizardPlan(customIncome)
    return NextResponse.json(plan)
  } catch (error: any) {
    console.error("Error generating monthly wizard plan:", error)
    return NextResponse.json(
      { error: "Failed to generate monthly wealth plan", details: error?.message },
      { status: 500 }
    )
  }
}
