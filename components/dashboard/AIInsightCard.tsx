"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { BrainCircuit, RefreshCw, CheckCircle2, AlertCircle, Lightbulb, Sparkles, TrendingUp, Settings, Target } from "lucide-react"

type AIInsightCardProps = {
  month: string
}

const insightConfig = [
  {
    icon: CheckCircle2,
    label: "Positive",
    color: "text-[hsl(var(--income))]",
    bg: "bg-[var(--income-bg)]",
    border: "border-[var(--income-border)]",
    actionIcon: TrendingUp,
    actionLabel: "View Details",
  },
  {
    icon: AlertCircle,
    label: "Warning",
    color: "text-[hsl(var(--warning))]",
    bg: "bg-[var(--warning-bg)]",
    border: "border-[var(--warning-border)]",
    actionIcon: Target,
    actionLabel: "Adjust Budget",
  },
  {
    icon: Lightbulb,
    label: "Tip",
    color: "text-[hsl(var(--savings))]",
    bg: "bg-[var(--savings-bg)]",
    border: "border-[var(--savings-border)]",
    actionIcon: Settings,
    actionLabel: "Take Action",
  },
]

function TypingText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    if (!active) {
      setDisplayed(text)
      return
    }
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
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
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
      setUpdatedAt(payload.updatedAt ?? new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load AI insights")
      setInsights(null)
    } finally {
      setLoading(false)
      setTimeout(() => setJustRefreshed(false), 3000)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [month])

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 relative overflow-hidden"
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              {/* Pulsing dot for active analysis */}
              {loading && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(var(--income))] rounded-full border-2 border-[hsl(var(--background))]"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-jakarta font-semibold text-sm text-foreground">AI Insights</h3>
                <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {updatedAt
                    ? `Updated ${new Date(updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
                    : "Analyzing your finances..."}
                </p>
                {!loading && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--income-bg)] border border-[var(--income-border)] text-[hsl(var(--income))]">
                    92% confidence
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 px-3 gap-2 text-xs flex-shrink-0"
            onClick={() => fetchInsights(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analyzing…" : "Refresh"}
          </Button>
        </div>

        {/* Loading state */}
        {loading && !insights && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[hsl(var(--muted))] rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[hsl(var(--border))] animate-pulse" />
                  <div className="h-4 w-32 rounded bg-[hsl(var(--border))] animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-[hsl(var(--border))] animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-[hsl(var(--border))] animate-pulse" />
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-3 pt-4 text-sm text-muted-foreground"
            >
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>FinPilot is analyzing your finances</span>
            </motion.div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[hsl(var(--muted))] rounded-xl p-4 text-sm text-[hsl(var(--destructive))]"
          >
            <p className="font-semibold">Insights unavailable</p>
            <p className="opacity-75 mt-0.5">{error}</p>
          </motion.div>
        )}

        {/* Insights */}
        {insights && !loading && (
          <div className="space-y-4">
            <AnimatePresence>
              {statusDetails.map((item, i) => {
                const Icon = item.icon
                const ActionIcon = item.actionIcon
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -12, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{
                      delay: i * 0.12,
                      type: "spring",
                      stiffness: 300,
                      damping: 28,
                    }}
                    className={`rounded-xl ${item.border} ${item.bg} p-4 transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                        <span className={`text-[10px] font-semibold tracking-[0.1em] uppercase ${item.color}`}>
                          {item.label}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
                      >
                        <ActionIcon className="w-3 h-3" />
                        {item.actionLabel}
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {item.value ? (
                        <TypingText text={item.value} active={justRefreshed} />
                      ) : (
                        <span className="text-muted-foreground italic">No data available</span>
                      )}
                    </p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
