import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    await prisma.transaction.deleteMany()
    await prisma.budget.deleteMany()
    await prisma.goal.deleteMany()
    await prisma.aICache.deleteMany()

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await prisma.transaction.deleteMany()
    await prisma.budget.deleteMany()
    await prisma.goal.deleteMany()
    await prisma.aICache.deleteMany()

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
