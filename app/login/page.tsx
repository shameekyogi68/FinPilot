"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || "Incorrect password")
        return
      }
      const params = new URLSearchParams(window.location.search)
      router.push(params.get("next") || "/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="surface-card p-8 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-9 h-9 rounded-[10px] bg-[#14131F] flex items-center justify-center flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </span>
          <span className="text-[19px] font-semibold text-[#14131F]">Runway</span>
        </div>
        <h1 className="text-[20px] font-semibold text-[#14131F] mb-1">Private access</h1>
        <p className="text-[13px] text-[#565469] mb-5">This is a private wealth dashboard. Enter the password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="field mb-3"
        />
        {error && <p className="text-[12.5px] text-[#A02727] mb-3">{error}</p>}
        <button type="submit" disabled={loading || !password} className="btn-primary w-full !justify-center">
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  )
}
