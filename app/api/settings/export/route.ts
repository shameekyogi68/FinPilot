import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    })

    const exported = {
      exported_at: new Date().toISOString(),
      profile: null,
      transactions: transactions ?? [],
    }

    return NextResponse.json(exported)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
