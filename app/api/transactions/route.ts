import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

const routeBodySchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Invalid date",
  }),
  note: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined

  try {
    const data = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      ...(limit && !Number.isNaN(limit) && limit > 0 ? { take: limit } : {}),
    })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return safeErrorResponse(error, "Failed to load transactions")
  }
}

export async function PATCH(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 50, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing transaction id" }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = routeBodySchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      { status: 400 }
    )
  }

  const { amount, type, category, date, note } = parseResult.data

  try {
    await prisma.transaction.update({
      where: { id },
      data: {
        amount,
        type,
        category,
        date: new Date(date),
        note,
      },
    })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to update transaction")
  }
}

export async function DELETE(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 20, 60_000)
  if (rateLimitError) return rateLimitError

  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing transaction id" }, { status: 400 })
  }

  try {
    await prisma.transaction.delete({
      where: { id },
    })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete transaction")
  }
}

export async function POST(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 50, 60_000)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => null)

  const parseResult = routeBodySchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      { status: 400 }
    )
  }

  const { amount, type, category, date, note } = parseResult.data

  try {
    await prisma.transaction.create({
      data: {
        amount,
        type,
        category,
        date: new Date(date),
        note,
      },
    })
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return safeErrorResponse(error, "Failed to create transaction")
  }
}
