"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react"
import { type DailyWealthPulse } from "@/services/ai/wealthManagerEngine"

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val)

export function DailyWealthPulseBanner() {
  const [pulse, setPulse] = useState<DailyWealthPulse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPulse = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/wealth-manager/daily-pulse")
      if (res.ok) {
        const data = await res.json()
        setPulse(data)
      }
    } catch (e) {
      console.error("Failed to load daily wealth pulse", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPulse()
  }, [])

  if (loading) {
    return (
      <div className="w-full p-6 rounded-3xl bg-[#12151E] border border-white/10 animate-pulse text-white/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-white/10 rounded" />
            <div className="h-3 w-64 bg-white/10 rounded" />
          </div>
        </div>
        <div className="h-9 w-32 bg-white/10 rounded-xl" />
      </div>
    )
  }

  if (!pulse) return null

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-[#090A0F] via-[#12151E] to-[#1A1D2B] border border-emerald-500/20 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-white">
      {/* Background Ambient Glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="w-full h-full rounded-[15px] bg-[#090A0F] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold tracking-tight text-white">
                Daily Wealth Manager Directive
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Pulse
              </span>
            </div>
            <p className="text-[12.5px] text-white/60">
              Autonomous execution & spending control system
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-white/50 block font-medium">
              Today's Spend Limit
            </span>
            <span className="text-[20px] font-extrabold text-emerald-400 tabular-nums">
              ₹{formatCurrency(pulse.safeDailySpend)}
            </span>
          </div>

          <button
            onClick={fetchPulse}
            aria-label="Refresh daily pulse"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Officer Executive Briefing */}
      {pulse.aiOfficerSummary && (
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13.5px] text-white/90 leading-relaxed">
              {pulse.aiOfficerSummary}
            </p>
            {pulse.modelUsed && (
              <span className="text-[10px] text-white/40 block mt-1">
                Powered by AI Model Consensus ({pulse.modelUsed})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Directives Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {pulse.directives.map((directive) => {
          const isWarning = directive.type === "warning"
          const isOpportunity = directive.type === "opportunity"

          return (
            <div
              key={directive.id}
              className={`p-4 rounded-2xl border transition-all ${
                isWarning
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  : isOpportunity
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-white/5 border-white/10 text-white/90"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : isOpportunity ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  )}
                  <h3 className="text-[13.5px] font-semibold tracking-tight">
                    {directive.title}
                  </h3>
                </div>
              </div>
              <p className="text-[12px] opacity-80 leading-snug mb-3">
                {directive.description}
              </p>

              {directive.actionUrl && (
                <Link
                  href={directive.actionUrl}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white hover:underline group"
                >
                  <span>{directive.actionLabel || "Execute Action"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
