"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Crown,
  X,
  CheckCircle2,
  Flame,
} from "lucide-react"
import { type DailyWealthPulse } from "@/services/ai/wealthManagerEngine"

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val)

export function DailyWealthPulseBanner() {
  const [pulse, setPulse] = useState<DailyWealthPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [bufferModalOpen, setBufferModalOpen] = useState(false)

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
          <div className="w-12 h-12 rounded-2xl bg-white/10" />
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
    <>
      <div className="w-full rounded-3xl bg-gradient-to-br from-[#090A0F] via-[#12151E] to-[#1A1D2B] border border-emerald-500/30 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden text-white">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* 3D Ultra-Luxury Gold & Emerald AI Emblem Crest */}
            <div className="relative group cursor-pointer" onClick={() => setBufferModalOpen(true)}>
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 rounded-2xl blur-sm opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12151E] to-[#090A0F] border border-emerald-400/50 flex items-center justify-center shadow-xl">
                <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]" />
                <Sparkles className="w-3 h-3 text-emerald-400 absolute top-1 right-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[18px] font-extrabold tracking-tight text-white flex items-center gap-2">
                  Daily Wealth Directive
                </h2>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                  AI Live Consensus
                </span>
              </div>
              <p className="text-[13px] text-slate-300 mt-0.5">
                Shameek Yogi&apos;s Autonomous Execution & Capital Growth Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Safe Daily Spend Cap
              </span>
              <span className="text-[22px] font-extrabold text-emerald-400 tabular-nums">
                ₹{formatCurrency(pulse.safeDailySpend)}
              </span>
            </div>

            <button
              onClick={fetchPulse}
              aria-label="Refresh daily pulse"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* AI Officer Executive Briefing */}
        {pulse.aiOfficerSummary && (
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] text-white/95 leading-relaxed font-medium">
                {pulse.aiOfficerSummary}
              </p>
              {pulse.modelUsed && (
                <span className="text-[10.5px] text-slate-400 block mt-1.5 font-semibold">
                  ⚡ Grounded in real ledger telemetry via AI Model Consensus ({pulse.modelUsed})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Directives Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          {pulse.directives.map((directive) => {
            const isWarning = directive.type === "warning"
            const isOpportunity = directive.type === "opportunity"

            return (
              <div
                key={directive.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isWarning
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-100"
                    : isOpportunity
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100"
                    : "bg-white/5 border-white/10 text-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isWarning ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    ) : isOpportunity ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    )}
                    <h3
                      className={`text-[14.5px] font-bold tracking-tight ${
                        isWarning
                          ? "text-amber-300"
                          : isOpportunity
                          ? "text-emerald-300"
                          : "text-teal-300"
                      }`}
                    >
                      {directive.title}
                    </h3>
                  </div>
                </div>
                <p
                  className={`text-[13px] leading-relaxed mb-3.5 ${
                    isWarning
                      ? "text-amber-100/90"
                      : isOpportunity
                      ? "text-emerald-100/90"
                      : "text-white/80"
                  }`}
                >
                  {directive.description}
                </p>

                {directive.actionUrl === "/buffer-analysis" ? (
                  <button
                    onClick={() => setBufferModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-amber-300 hover:text-amber-200 hover:underline group cursor-pointer"
                  >
                    <span>Analyze Safety Buffer</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  directive.actionUrl && (
                    <Link
                      href={directive.actionUrl}
                      className={`inline-flex items-center gap-1.5 text-[13px] font-bold hover:underline group ${
                        isWarning
                          ? "text-amber-300"
                          : isOpportunity
                          ? "text-emerald-300"
                          : "text-teal-300"
                      }`}
                    >
                      <span>{directive.actionLabel || "Execute Action"}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Safety Buffer Intelligence Modal */}
      <AnimatePresence>
        {bufferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#12151E] border border-white/10 rounded-3xl p-7 max-w-lg w-full text-white shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setBufferModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-white tracking-tight">
                    Safety Buffer Intelligence
                  </h2>
                  <p className="text-[12.5px] text-slate-400">
                    Shameek Yogi&apos;s Liquidity Protection & Risk Assessment
                  </p>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                      Current Liquid Reserve
                    </span>
                    <span className="text-[22px] font-bold text-emerald-400 tabular-nums">
                      ₹{formatCurrency(pulse.netWorth)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {pulse.runwayMonths !== null ? `${pulse.runwayMonths.toFixed(1)} Months covered` : "0.0 Months covered"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                      Buffer Target Goal
                    </span>
                    <span className="text-[22px] font-bold text-amber-400 tabular-nums">
                      {pulse.safeDailySpend > 0 ? `₹${formatCurrency(pulse.safeDailySpend * 90)}` : "₹0"}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      3.0 Months safety goal
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-[14px]">
                    <Flame className="w-4.5 h-4.5 text-amber-400" />
                    <span>Buffer Intelligence & Execution</span>
                  </div>
                  <ul className="space-y-2 text-[12.5px] text-amber-100/90">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        {pulse.netWorth > 0 
                          ? `Liquid reserve is currently ₹${formatCurrency(pulse.netWorth)}.`
                          : "Ledger is on a clean slate. No liquid cash recorded yet for August 1."}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        {pulse.safeDailySpend > 0 
                          ? `Daily safe spending cap is locked at ₹${formatCurrency(pulse.safeDailySpend)}/day.`
                          : "Set your baseline monthly income in Settings to enable daily spending limits."}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Surplus cash flow will be routed to liquid mutual fund reserves during monthly wizard execution.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setBufferModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-[13px] hover:opacity-90 shadow-md shadow-emerald-500/20"
                >
                  Got It, Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
