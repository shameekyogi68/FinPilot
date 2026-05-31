import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [transactions, budgets, goals] = await Promise.all([
      prisma.transaction.count(),
      prisma.budget.count(),
      prisma.goal.count(),
    ])
    
    return NextResponse.json({ transactions, budgets, goals })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
