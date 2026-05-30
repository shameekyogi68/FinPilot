import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
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

const createSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

export async function GET(request: Request) {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service configuration" },
      { status: 500 }
    )
  }

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined

  let query = supabase.from("transactions").select("*").order("date", { ascending: false })

  if (limit && !Number.isNaN(limit) && limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service configuration" },
      { status: 500 }
    )
  }

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

  const parsedId = Number(id)
  const updateQuery = Number.isNaN(parsedId)
    ? supabase.from("transactions").update({ amount, type, category, date, note }).eq("id", id)
    : supabase.from("transactions").update({ amount, type, category, date, note }).eq("id", parsedId)

  const { error } = await updateQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service configuration" },
      { status: 500 }
    )
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing transaction id" }, { status: 400 })
  }

  const parsedId = Number(id)
  const deleteQuery = Number.isNaN(parsedId)
    ? supabase.from("transactions").delete().eq("id", id)
    : supabase.from("transactions").delete().eq("id", parsedId)

  const { error } = await deleteQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service configuration" },
      { status: 500 }
    )
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

  const { error } = await supabase.from("transactions").insert({
    amount,
    type,
    category,
    date,
    note,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
