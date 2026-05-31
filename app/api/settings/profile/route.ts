import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const currencyValues = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"] as const
const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  currency: z.enum(currencyValues),
  monthly_income: z.number().nonnegative(),
  savings_target: z.number().nonnegative().optional(),
  theme: z.enum(["light", "dark"]),
  default_month_view: z.enum(["current", "last"]),
  ai_enabled: z.boolean(),
})

export async function GET() {
  try {
    let profile = await prisma.profile.findUnique({ where: { id: 1 } })
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: 1,
          name: "You",
          currency: "INR",
          monthly_income: 0,
          savings_target: 0,
          theme: "dark",
          default_month_view: "current",
          ai_enabled: true,
        },
      })
    }
    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const parseResult = profileSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues.map((issue) => issue.message).join(", "),
      },
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: {
        name: data.name,
        email: data.email ?? null,
        currency: data.currency,
        monthly_income: data.monthly_income,
        savings_target: data.savings_target ?? 0,
        theme: data.theme,
        default_month_view: data.default_month_view,
        ai_enabled: data.ai_enabled,
      },
      create: {
        id: 1,
        name: data.name,
        email: data.email ?? null,
        currency: data.currency,
        monthly_income: data.monthly_income,
        savings_target: data.savings_target ?? 0,
        theme: data.theme,
        default_month_view: data.default_month_view,
        ai_enabled: data.ai_enabled,
      }
    })
    return NextResponse.json({ status: "ok", profile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
