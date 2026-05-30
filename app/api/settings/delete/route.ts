import { NextResponse } from "next/server"

import { createSupabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST() {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  try {
    // Delete from all tables
    await supabase.from("transactions").delete().neq("id", 0)
    await supabase.from("budgets").delete().neq("id", 0)
    await supabase.from("goals").delete().neq("id", 0)
    await supabase.from("ai_cache").delete().neq("id", 0)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  try {
    // Delete from all tables
    await supabase.from("transactions").delete().neq("id", 0)
    await supabase.from("budgets").delete().neq("id", 0)
    await supabase.from("goals").delete().neq("id", 0)
    await supabase.from("ai_cache").delete().neq("id", 0)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
