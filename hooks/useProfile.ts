"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export type Profile = {
  id?: number
  name?: string
  email?: string
  currency?: string
  monthly_income?: number
  savings_target?: number
  theme?: string
  default_month_view?: string
  ai_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data, error } = await supabase.from("profile").select("*").single()
    if (error) {
      console.error("Unable to fetch profile", error)
      setProfile(null)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  async function updateProfile(updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profile")
      .update(updates)
      .eq("id", 1)
      .select()
      .single()

    if (error) {
      console.error("Unable to update profile", error)
      return null
    }

    setProfile(data)
    return data
  }

  return { profile, loading, updateProfile }
}
