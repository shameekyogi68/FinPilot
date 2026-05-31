import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined

  try {
    const data = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      ...(limit && !Number.isNaN(limit) && limit > 0 ? { take: limit } : {}),
    })
    return NextResponse.json(data ?? [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
