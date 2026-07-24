"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp } from "lucide-react"
import { type MFSearchResult, type MFDetails } from "@/services/market/mfApi"

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(val)

export function MutualFundIntelligence() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MFSearchResult[]>([])
  const [selectedCode, setSelectedCode] = useState<number | null>(null)
  const [details, setDetails] = useState<MFDetails | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch initial scheme or search
  useEffect(() => {
    if (!selectedCode) return

    async function loadScheme() {
      setLoading(true)
      try {
        const res = await fetch(`/api/market/mutual-funds?code=${selectedCode}`)
        if (res.ok) {
          const data = await res.json()
          setDetails(data)
        }
      } catch (e) {
        console.error("Failed to load scheme details", e)
      } finally {
        setLoading(false)
      }
    }

    loadScheme()
  }, [selectedCode])

  // Handle Search input
  const handleSearch = async (val: string) => {
    setQuery(val)
    if (val.trim().length < 2) {
      setResults([])
      return
    }

    try {
      const res = await fetch(`/api/market/mutual-funds?q=${encodeURIComponent(val)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (e) {
      console.error("Search failed", e)
    }
  }

  return (
    <div className="surface-card p-6 rounded-3xl bg-[#090A0F] border border-emerald-500/20 text-white space-y-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-white">
              Live Mutual Funds Market Intelligence
            </h2>
            <p className="text-[12.5px] text-white/60">
              Real-time NAV tracking & CAGR analytics (api.mfapi.in / AMFI)
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search Direct Mutual Funds…"
            className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/15 rounded-xl text-[13px] text-white focus:outline-none focus:border-emerald-500"
          />

          {/* Search Dropdown */}
          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#12151E] border border-white/15 rounded-2xl max-h-60 overflow-y-auto shadow-2xl z-30 divide-y divide-white/5">
              {results.map((r) => (
                <button
                  key={r.schemeCode}
                  onClick={() => {
                    setSelectedCode(r.schemeCode)
                    setQuery("")
                    setResults([])
                  }}
                  className="w-full p-3 text-left hover:bg-white/10 text-[12.5px] text-white/90 truncate transition-colors"
                >
                  {r.schemeName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Fund Details Card or Search Prompt */}
      {loading ? (
        <div className="p-8 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center text-white/50 text-[13px]">
          Loading Live Mutual Fund Data…
        </div>
      ) : details ? (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2 inline-block">
                {details.meta.scheme_category || "Direct Mutual Fund"}
              </span>
              <h3 className="text-[16px] font-bold text-white leading-snug">
                {details.meta.scheme_name}
              </h3>
              <p className="text-[12px] text-white/50 mt-0.5">
                Fund House: {details.meta.fund_house} • Scheme Code: {details.meta.scheme_code}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-white/50 block">Current NAV</span>
              <span className="text-[24px] font-extrabold text-emerald-400 tabular-nums">
                ₹{formatCurrency(details.currentNav)}
              </span>
              <span className="text-[10.5px] text-white/40 block">As of {details.latestDate}</span>
            </div>
          </div>

          {/* CAGR Returns Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10.5px] text-white/50 block">1 Year CAGR</span>
              <span className="text-[15px] font-bold text-emerald-400">
                {details.cagr1Y !== null ? `${details.cagr1Y > 0 ? "+" : ""}${details.cagr1Y}%` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10.5px] text-white/50 block">3 Year CAGR</span>
              <span className="text-[15px] font-bold text-emerald-400">
                {details.cagr3Y !== null ? `${details.cagr3Y > 0 ? "+" : ""}${details.cagr3Y}%` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10.5px] text-white/50 block">5 Year CAGR</span>
              <span className="text-[15px] font-bold text-emerald-400">
                {details.cagr5Y !== null ? `${details.cagr5Y > 0 ? "+" : ""}${details.cagr5Y}%` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-slate-400">
            Search any Indian Direct Mutual Fund above to inspect live NAV, CAGR returns, and fund metadata.
          </p>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSelectedCode(122639)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11.5px] font-medium text-emerald-300 transition-colors"
            >
              Parag Parikh Flexi Cap
            </button>
            <button
              onClick={() => setSelectedCode(120716)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11.5px] font-medium text-emerald-300 transition-colors"
            >
              UTI Nifty 50 Index
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
