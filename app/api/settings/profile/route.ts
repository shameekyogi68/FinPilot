import { NextResponse } from "next/server"
import { z } from "zod"

import { createSupabaseAdmin } from "@/lib/supabaseAdmin"

const currencyValues = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"] as const
const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  currency: z.enum(currencyValues),
  monthly_income: z.number().nonnegative(),
  savings_target: z.number().nonnegative().optional(),
  theme: z.enum(["light", "dark"]),
  default_month_view: z.enum(["current", "last"]),
  ai_enabled: z.boolean(),
})

async function ensureProfileTable(supabase: any) {
  const sql = `
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'You',
      email TEXT,
      currency TEXT DEFAULT 'USD',
      monthly_income DECIMAL(12,2) DEFAULT 0,
      savings_target DECIMAL(12,2) DEFAULT 0,
      theme TEXT DEFAULT 'dark',
      default_month_view TEXT DEFAULT 'current',
      ai_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS default_month_view TEXT DEFAULT 'current';
    INSERT INTO profile (id, name, email, currency, monthly_income, default_month_view, ai_enabled)
    SELECT 1, 'You', '', 'USD', 0, 'current', true
    WHERE NOT EXISTS (SELECT 1 FROM profile WHERE id = 1);
  `

  if (typeof supabase.sql?.query !== "function") {
    return
  }

  await supabase.sql.query(sql)
}

export async function GET() {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

  try {
    await ensureProfileTable(supabase)
  } catch (error) {
    console.error("Unable to ensure profile table", error)
  }

  const { data, error } = await supabase.from("profile").select("*").limit(1).single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? {})
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase service configuration" }, { status: 500 })
  }

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

  const payload = {
    id: 1,
    name: parseResult.data.name,
    email: parseResult.data.email || null,
    currency: parseResult.data.currency,
    monthly_income: parseResult.data.monthly_income,
    savings_target: parseResult.data.savings_target ?? 0,
    theme: parseResult.data.theme,
    default_month_view: parseResult.data.default_month_view,
    ai_enabled: parseResult.data.ai_enabled,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("profile").upsert(payload, { onConflict: "id" })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
