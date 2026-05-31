import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(_request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(_request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const { id } = await params
    await prisma.goal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete goal")
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

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
    return safeErrorResponse(error, "Failed to update goal")
  }
}
