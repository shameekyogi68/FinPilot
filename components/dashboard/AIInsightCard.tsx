"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AIInsightCardProps = {
  month: string
}

type InsightsResponse = {
  insights: string[]
  updatedAt: string
}

export function AIInsightCard({ month }: AIInsightCardProps) {
  const [insights, setInsights] = useState<string[] | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const query = new URLSearchParams({ month })
      if (forceRefresh) {
        query.set("refresh", "true")
      }

      const response = await fetch(`/api/insights?${query.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load AI insights")
      }

      setInsights(payload.insights ?? [])
      setUpdatedAt(payload.updatedAt ?? new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load AI insights")
      setInsights(null)
      setUpdatedAt(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [month])

  const statusDetails = useMemo(
    () => [
      { icon: "🟢", label: "Positive observation", value: insights?.[0] ?? "Loading positive insight..." },
      { icon: "🟡", label: "Improvement area", value: insights?.[1] ?? "Loading improvement area..." },
      { icon: "🔵", label: "Recommendation", value: insights?.[2] ?? "Loading recommendation..." },
    ],
    [insights]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI insights</CardTitle>
        <CardDescription>Smart finance guidance for {month}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {updatedAt ? `Last updated ${new Date(updatedAt).toLocaleString()}` : "Fetching insights..."}
          </div>
          <Button size="sm" onClick={() => fetchInsights(true)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            <p className="font-semibold">AI insights unavailable</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {statusDetails.map((item) => (
              <div key={item.label} className="rounded-3xl border border-border bg-muted p-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {loading ? "Loading…" : item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
