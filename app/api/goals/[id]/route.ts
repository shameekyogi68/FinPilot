import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.goal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, targetAmount, currentAmount, deadline } = body

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(targetAmount !== undefined && { targetAmount: Number(targetAmount) }),
        ...(currentAmount !== undefined && { currentAmount: Number(currentAmount) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      },
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error("PATCH /api/goals/[id] error:", error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}
