"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Target,
  Settings,
} from "lucide-react"

type AIInsightCardProps = {
  month: string
}

const insightConfig = [
  {
    icon: CheckCircle2,
    label: "Positive",
    className: "insight-positive",
    iconColor: "text-emerald-600",
    actionIcon: TrendingUp,
    actionLabel: "View Details",
  },
  {
    icon: AlertTriangle,
    label: "Warning",
    className: "insight-warning",
    iconColor: "text-amber-600",
    actionIcon: Target,
    actionLabel: "Adjust Budget",
  },
  {
    icon: Lightbulb,
    label: "Tip",
    className: "insight-tip",
    iconColor: "text-brand-600",
    actionIcon: Settings,
    actionLabel: "Take Action",
  },
]

function TypingText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    if (!active) { setDisplayed(text); return }
    setDisplayed("")
    if (!text) return
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [text, active])

  return <span>{displayed}</span>
}

export function AIInsightCard({ month }: AIInsightCardProps) {
  const [insights, setInsights] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [justRefreshed, setJustRefreshed] = useState(false)

  const fetchInsights = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    if (forceRefresh) setJustRefreshed(true)

    try {
      const query = new URLSearchParams({ month })
      if (forceRefresh) query.set("refresh", "true")

      const response = await fetch(`/api/insights?${query.toString()}`)
      const payload = await response.json()

      if (!response.ok) throw new Error(payload.error || "Unable to load AI insights")

      setInsights(payload.insights ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load AI insights")
      setInsights(null)
    } finally {
      setLoading(false)
      setTimeout(() => setJustRefreshed(false), 3000)
    }
  }

  useEffect(() => { fetchInsights() }, [month])

  const statusDetails = useMemo(
    () =>
      insightConfig.map((config, i) => ({
        ...config,
        value: insights?.[i] ?? "",
      })),
    [insights]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="fp-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} strokeWidth={1.5} className="text-[#7C3AED]" aria-hidden="true" />
          <h2 className="text-[15px] font-medium text-[#0F0E17]">AI Insights</h2>
          {!loading && (
            <span className="fp-chip fp-chip-brand">
              92% confidence
            </span>
          )}
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={loading}
          aria-label="Refresh AI insights"
          className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[rgba(0,0,0,0.06)] bg-white/70 text-[12px] text-[#4B4963] font-medium hover:border-[rgba(0,0,0,0.14)] hover:text-[#0F0E17] transition-all duration-150 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
        >
          <RefreshCw
            size={13}
            strokeWidth={1.5}
            className={loading ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {loading ? "Analyzing…" : "Refresh"}
        </button>
      </div>

      {/* Loading */}
      {loading && !insights && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[10px] bg-[#F8F7FF] p-4 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-[rgba(0,0,0,0.06)]" />
                <div className="h-3 w-20 rounded-full bg-[rgba(0,0,0,0.06)]" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-[rgba(0,0,0,0.06)]" />
                <div className="h-3 w-3/4 rounded-full bg-[rgba(0,0,0,0.06)]" />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="text-[13px] text-[#8B89A0] ml-1">FinPilot is analyzing your finances</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-[10px] bg-[#FEF2F2] border border-[rgba(220,38,38,0.15)] p-4 text-sm text-[#991B1B]">
          <p className="font-medium">Insights unavailable</p>
          <p className="opacity-75 mt-0.5 text-[13px]">{error}</p>
        </div>
      )}

      {/* Insights */}
      {insights && !loading && (
        <div className="space-y-3">
          <AnimatePresence>
            {statusDetails.map((item, i) => {
              const Icon = item.icon
              const ActionIcon = item.actionIcon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                  className={`insight-card ${item.className}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={15}
                        strokeWidth={2}
                        className={`flex-shrink-0 ${item.iconColor}`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-[11px] font-bold tracking-[0.08em] uppercase ${item.iconColor}`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <button
                      className="flex items-center gap-1 text-[11px] text-[#8B89A0] hover:text-[#0F0E17] transition-colors duration-150 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-[4px] px-1"
                    >
                      <ActionIcon size={11} strokeWidth={1.5} aria-hidden="true" />
                      {item.actionLabel}
                    </button>
                  </div>
                  <p className="text-[14px] leading-[1.6] text-[#0F0E17] relative z-10 font-medium">
                    {item.value ? (
                      <TypingText text={item.value} active={justRefreshed} />
                    ) : (
                      <span className="text-[#8B89A0] italic">No data available</span>
                    )}
                  </p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
