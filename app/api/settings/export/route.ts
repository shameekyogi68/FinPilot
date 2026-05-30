import { NextResponse } from "next/server"

import { createSupabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  const [transactionsResult, profileResult] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("profile").select("*").limit(1).single(),
  ])

  if (transactionsResult.error) {
    return NextResponse.json({ error: transactionsResult.error.message }, { status: 500 })
  }

  const exported = {
    exported_at: new Date().toISOString(),
    profile: profileResult.data ?? null,
    transactions: transactionsResult.data ?? [],
  }

  return NextResponse.json(exported)
}
