"use client"

import { useEffect, useState } from "react"

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
    try {
      const res = await fetch("/api/settings/profile")
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
      } else {
        console.error("Unable to fetch profile", data.error)
        setProfile(null)
      }
    } catch (error) {
      console.error("Unable to fetch profile", error)
      setProfile(null)
    }
    setLoading(false)
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        return data
      } else {
        console.error("Unable to update profile", data.error)
        return null
      }
    } catch (error) {
      console.error("Unable to update profile", error)
      return null
    }
  }

  return { profile, loading, updateProfile }
}
