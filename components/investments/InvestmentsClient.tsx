"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Plus, Pencil, Trash2, X, Wallet, TrendingUp, TrendingDown, PieChart,
  Shield, Landmark, Building2, Coins, Calculator, LayoutGrid, RefreshCw, AlertTriangle,
} from "lucide-react"
import { inr } from "@/lib/utils/format"
import type { Holding, PortfolioSummary } from "@/lib/queries/investmentQueries"
import type { OverspendHistory } from "@/lib/queries/queries"
import { sipFutureValue, sipRequiredForTarget, swpMonthsRemaining } from "@/lib/utils/finance"
import { toast } from "sonner"
import { MutualFundIntelligence } from "@/components/wealth/MutualFundIntelligence"

const TYPE_META: Record<string, { label: string; icon: React.ElementType; category: string }> = {
  stock: { label: "Stock", icon: TrendingUp, category: "equity" },
  equity_mf: { label: "Equity Mutual Fund", icon: PieChart, category: "equity" },
  debt_mf: { label: "Debt Mutual Fund", icon: Shield, category: "debt" },
  fd: { label: "Fixed Deposit", icon: Landmark, category: "debt" },
  ppf: { label: "PPF", icon: Building2, category: "debt" },
  gold: { label: "Gold", icon: Coins, category: "gold" },
  other: { label: "Other", icon: Wallet, category: "other" },
}

const CATEGORY_LABEL: Record<string, string> = {
  equity: "Equity",
  debt: "Debt",
  gold: "Gold",
  cash: "Cash",
  other: "Other",
}

const CATEGORY_COLOR: Record<string, string> = {
  equity: "#6D55E3",
  debt: "#3D9BD0",
  gold: "#E89B3C",
  cash: "#18A87E",
  other: "#9A98AC",
}

const PRICE_REFRESHABLE_TYPES = new Set(["stock", "equity_mf", "debt_mf"])

type Tab = "portfolio" | "calculators"

export function InvestmentsClient({
  initialSummary,
  overspend,
}: {
  initialSummary: PortfolioSummary
  overspend: OverspendHistory
}) {
  const router = useRouter()
  const summary = initialSummary
  const [tab, setTab] = useState<Tab>("portfolio")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Holding | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSave = async (data: {
    name: string
    type: string
    investedAmount: number
    currentValue: number
    units: number | null
    symbol: string | null
  }) => {
    setBusy(true)
    try {
      const payload = { ...data, category: TYPE_META[data.type].category }
      const res = await fetch(editing ? `/api/investments/${editing.id}` : "/api/investments", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to save holding")
        return
      }
      toast.success(editing ? "Holding updated" : "Holding added")
      setOpen(false)
      setEditing(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleRefreshPrice = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/investments/${id}/refresh-price`, { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to refresh price")
        return
      }
      toast.success(`Price updated from ${json.quote?.source === "mfapi" ? "mfapi.in" : "Yahoo Finance"}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/investments/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Unable to remove holding")
        return
      }
      toast.success("Holding removed")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-white leading-[1.1]">
            <span className="font-display italic text-gradient">Investments</span>
          </h1>
          <p className="text-[14px] text-slate-300 mt-2">
            Your holdings, your allocation, and the math behind SIPs and withdrawals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setTab("portfolio")}
              className={`h-8 px-3.5 text-[12.5px] font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 ${
                tab === "portfolio" ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={13} strokeWidth={1.75} />
              Portfolio
            </button>
            <button
              onClick={() => setTab("calculators")}
              className={`h-8 px-3.5 text-[12.5px] font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 ${
                tab === "calculators" ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Calculator size={13} strokeWidth={1.75} />
              Calculators
            </button>
          </div>
          {tab === "portfolio" && (
            <button
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
              className="btn-primary"
            >
              <Plus size={14} strokeWidth={2} />
              Add holding
            </button>
          )}
        </div>
      </motion.div>

      {tab === "portfolio" ? (
        <PortfolioView
          summary={summary}
          busy={busy}
          onEdit={(h) => {
            setEditing(h)
            setOpen(true)
          }}
          onDelete={handleDelete}
          onRefreshPrice={handleRefreshPrice}
        />
      ) : (
        <CalculatorsView summary={summary} overspend={overspend} />
      )}

      {open && (
        <HoldingModal
          initial={editing}
          busy={busy}
          onClose={() => {
            setOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function PortfolioView({
  summary,
  busy,
  onEdit,
  onDelete,
  onRefreshPrice,
}: {
  summary: PortfolioSummary
  busy: boolean
  onEdit: (h: Holding) => void
  onDelete: (id: string) => void
  onRefreshPrice: (id: string) => void
}) {
  const gainPositive = summary.totalGain >= 0

  return (
    <div className="space-y-6">
      {/* Live Mutual Funds Market Intelligence */}
      <MutualFundIntelligence />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-tile">
          <p className="section-title mb-2">Net worth</p>
          <p className="text-[20px] sm:text-[22px] font-semibold tabular-nums text-[#14131F]">{inr(summary.netWorth)}</p>
          <p className="text-[11px] text-[#8C8AA0] mt-2">Cash + investments</p>
        </div>
        <div className="stat-tile">
          <p className="section-title mb-2">Invested</p>
          <p className="text-[20px] sm:text-[22px] font-semibold tabular-nums text-[#14131F]">{inr(summary.totalInvested)}</p>
        </div>
        <div className="stat-tile">
          <p className="section-title mb-2">Current value</p>
          <p className="text-[20px] sm:text-[22px] font-semibold tabular-nums text-[#14131F]">{inr(summary.totalCurrentValue)}</p>
        </div>
        <div className="stat-tile">
          <p className="section-title mb-2">Total gain/loss</p>
          <p className={`text-[20px] sm:text-[22px] font-semibold tabular-nums inline-flex items-center gap-1 ${gainPositive ? "text-[#0E8A5F]" : "text-[#A02727]"}`}>
            {gainPositive ? <TrendingUp size={16} strokeWidth={2} /> : <TrendingDown size={16} strokeWidth={2} />}
            {inr(summary.totalGain)}
          </p>
          <p className={`text-[11px] mt-2 ${gainPositive ? "text-[#0E8A5F]" : "text-[#A02727]"}`}>
            {summary.totalGainPct.toFixed(1)}% overall
          </p>
        </div>
      </div>

      {/* Allocation */}
      {summary.allocation.length > 0 && (
        <div className="surface-card p-6">
          <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Allocation — current vs. target</h3>
          <p className="text-[12.5px] text-[#8C8AA0] mb-5">
            Target is a framework you set yourself in Settings — not a recommendation.
          </p>
          <div className="space-y-4">
            {summary.allocation.map((slice) => (
              <div key={slice.category}>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-[#14131F] font-medium flex items-center gap-1.5">
                    {CATEGORY_LABEL[slice.category] ?? slice.category}
                    {slice.needsRebalance && (
                      <span
                        className="pill pill-warn !py-0 !px-1.5 !text-[10px] inline-flex items-center gap-1"
                        title={`${slice.driftPct > 0 ? "Over" : "Under"} target by ${Math.abs(slice.driftPct).toFixed(0)}pp`}
                      >
                        <AlertTriangle size={10} strokeWidth={2} />
                        {slice.driftPct > 0 ? "Over target" : "Under target"}
                      </span>
                    )}
                  </span>
                  <span className="text-[#565469] tabular-nums">
                    {slice.pct.toFixed(0)}%{slice.targetPct > 0 ? ` · target ${slice.targetPct.toFixed(0)}%` : ""}
                  </span>
                </div>
                <div className="progress-track !h-2.5 relative">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(slice.pct, 100)}%`, background: CATEGORY_COLOR[slice.category] ?? "#9A98AC" }}
                  />
                  {slice.targetPct > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-[#14131F]"
                      style={{ left: `${Math.min(slice.targetPct, 100)}%` }}
                      title={`Target ${slice.targetPct.toFixed(0)}%`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          {summary.allocation.some((s) => s.needsRebalance) && (
            <p className="text-[11.5px] text-[#8C8AA0] mt-4">
              "Over/under target" just flags a gap of {summary.rebalanceThresholdPct}+ percentage points from your own
              target (your configured threshold) — a rule-of-thumb rebalance trigger, not advice on what to buy or sell.
            </p>
          )}
        </div>
      )}

      {/* Holdings */}
      {summary.holdings.length === 0 ? (
        <div className="surface-card p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[20px]">📈</div>
          <p className="text-[15px] font-bold text-white">No holdings yet</p>
          <p className="text-[13px] text-slate-400 mt-1">Add what you actually hold — stocks, mutual funds, FDs, gold.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {summary.holdings.map((h, idx) => {
            const meta = TYPE_META[h.type] ?? TYPE_META.other
            const Icon = meta.icon
            const gain = h.currentValue - h.investedAmount
            const gainPct = h.investedAmount > 0 ? (gain / h.investedAmount) * 100 : 0
            const positive = gain >= 0
            const color = CATEGORY_COLOR[h.category] ?? "#9A98AC"
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="surface-card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}14`, color }}>
                      <Icon size={18} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#14131F]">{h.name}</p>
                      <p className="text-[12px] text-[#8C8AA0] mt-0.5">{meta.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {PRICE_REFRESHABLE_TYPES.has(h.type) && h.symbol && h.units && (
                      <button
                        onClick={() => onRefreshPrice(h.id)}
                        disabled={busy}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#F4F1FB] hover:text-[#4A30A8] transition-colors"
                        aria-label="Refresh price"
                        title="Pull the latest price"
                      >
                        <RefreshCw size={14} strokeWidth={1.75} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(h)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#F4F1FB] hover:text-[#14131F] transition-colors"
                      aria-label="Edit holding"
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => onDelete(h.id)}
                      disabled={busy}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#FCEEEC] hover:text-[#A02727] transition-colors"
                      aria-label="Delete holding"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[12px] text-[#8C8AA0]">Current value</p>
                    <p className="text-[17px] font-semibold text-[#14131F] tabular-nums">{inr(h.currentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-medium tabular-nums ${positive ? "text-[#0E8A5F]" : "text-[#A02727]"}`}>
                      {positive ? "+" : ""}{inr(gain)}
                    </p>
                    <p className={`text-[11px] ${positive ? "text-[#0E8A5F]" : "text-[#A02727]"}`}>{gainPct.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CalculatorsView({ summary, overspend }: { summary: PortfolioSummary; overspend: OverspendHistory }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {overspend.monthsConsidered > 0 && overspend.avgMonthlyOverspend > 0 && (
        <OverspendCostCard overspend={overspend} />
      )}
      <FundPerformanceLookup />
      <SipCalculator />
      <SwpCalculator />
      <DrawdownCalculator summary={summary} />
    </div>
  )
}

type FundPerformance = {
  schemeName: string
  fundHouse: string
  category: string
  latestNav: number
  asOf: string
  cagr1y: number | null
  cagr3y: number | null
  cagr5y: number | null
}

function FundPerformanceLookup() {
  const [schemeCode, setSchemeCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FundPerformance | null>(null)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schemeCode.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/investments/fund-performance?schemeCode=${encodeURIComponent(schemeCode.trim())}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Unable to look up that scheme code")
        return
      }
      setResult(json)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-6 lg:col-span-2">
      <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Fund performance lookup</h3>
      <p className="text-[12.5px] text-[#8C8AA0] mb-5">
        Real historical returns for any Indian mutual fund, computed from actual NAV history via mfapi.in — not a
        recommendation, just the numbers. Find a scheme code at{" "}
        <span className="font-medium text-[#14131F]">mfapi.in</span> or AMFI.
      </p>
      <form onSubmit={lookup} className="flex items-center gap-2 mb-5">
        <input
          value={schemeCode}
          onChange={(e) => setSchemeCode(e.target.value)}
          placeholder="AMFI scheme code, e.g. 120503"
          className="field flex-1"
        />
        <button type="submit" disabled={loading || !schemeCode.trim()} className="btn-primary flex-shrink-0">
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>

      {result && (
        <div className="p-4 rounded-2xl bg-[#F4F1FB] border border-[rgba(109,85,227,0.14)]">
          <p className="text-[13.5px] font-semibold text-[#14131F]">{result.schemeName}</p>
          <p className="text-[11.5px] text-[#8C8AA0] mt-0.5">
            {result.fundHouse} · {result.category} · NAV {inr(result.latestNav)} as of{" "}
            {new Date(result.asOf).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <CagrTile label="1 year" value={result.cagr1y} />
            <CagrTile label="3 years" value={result.cagr3y} />
            <CagrTile label="5 years" value={result.cagr5y} />
          </div>
          <p className="text-[11px] text-[#8C8AA0] mt-4">
            Past performance is historical fact, not a predictor of future returns.
          </p>
        </div>
      )}
    </div>
  )
}

function CagrTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="p-3 rounded-xl bg-white border border-[rgba(20,19,31,0.06)] text-center">
      <p className="text-[10.5px] uppercase tracking-wide text-[#8C8AA0] font-semibold mb-1">{label}</p>
      {value === null ? (
        <p className="text-[15px] font-semibold text-[#C4C2D4]">—</p>
      ) : (
        <p className={`text-[15px] font-semibold tabular-nums ${value >= 0 ? "text-[#0E8A5F]" : "text-[#A02727]"}`}>
          {value >= 0 ? "+" : ""}
          {value.toFixed(1)}%
        </p>
      )}
    </div>
  )
}

function OverspendCostCard({ overspend }: { overspend: OverspendHistory }) {
  const years = 10
  const rate = 12
  const projected = sipFutureValue(overspend.avgMonthlyOverspend, rate, years)

  return (
    <div className="surface-card p-6 lg:col-span-2 border-l-4 border-l-[#E89B3C]">
      <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Cost of overspending your flexible budgets</h3>
      <p className="text-[12.5px] text-[#8C8AA0] mb-5">
        Based on your actual trailing {overspend.monthsConsidered} month{overspend.monthsConsidered === 1 ? "" : "s"} —
        real spend against your current non-essential budget limits, applied retroactively.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#FCF3E1] border border-[rgba(199,122,31,0.20)]">
          <p className="text-[11px] uppercase tracking-wide text-[#8A5612] font-semibold mb-1.5">Avg overspend / month</p>
          <p className="text-[18px] font-semibold text-[#8A5612] tabular-nums">{inr(overspend.avgMonthlyOverspend)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#F4F1FB] border border-[rgba(109,85,227,0.14)]">
          <p className="text-[11px] uppercase tracking-wide text-[#4A30A8] font-semibold mb-1.5">
            If invested instead, {years}yr @ {rate}%
          </p>
          <p className="text-[18px] font-semibold text-[#4A30A8] tabular-nums">{inr(projected)}</p>
        </div>
      </div>
    </div>
  )
}

const SHOCK_PRESETS = [-10, -20, -30, -40, -50]

function DrawdownCalculator({ summary }: { summary: PortfolioSummary }) {
  const [shock, setShock] = useState(-30)

  const equitySlice = summary.allocation.find((a) => a.category === "equity")
  const equityValue = equitySlice?.value ?? 0
  const otherValue = summary.totalCurrentValue - equityValue
  const shockedEquity = equityValue * (1 + shock / 100)
  const shockedPortfolio = shockedEquity + otherValue
  const portfolioLoss = summary.totalCurrentValue - shockedPortfolio
  const shockedNetWorth = summary.netWorth - portfolioLoss

  return (
    <div className="surface-card p-6 lg:col-span-2">
      <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">Drawdown stress test</h3>
      <p className="text-[12.5px] text-[#8C8AA0] mb-5">
        What a market shock to your equity holdings would do to your real numbers today — a "what if," not a forecast.
        Debt, gold, and cash are assumed unaffected.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {SHOCK_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setShock(p)}
            className={`h-8 px-3.5 text-[12.5px] font-medium rounded-lg border transition-all ${
              shock === p
                ? "bg-[#A02727] text-white border-[#A02727]"
                : "bg-white text-[#565469] border-[rgba(20,19,31,0.10)] hover:border-[#A02727] hover:text-[#A02727]"
            }`}
          >
            {p}%
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-[12.5px] text-[#8C8AA0]">Custom:</span>
          <input
            type="number"
            value={shock}
            onChange={(e) => setShock(Number(e.target.value) || 0)}
            className="field !w-20 !h-8 tabular-nums text-center"
          />
          <span className="text-[12.5px] text-[#8C8AA0]">%</span>
        </div>
      </div>

      {summary.totalCurrentValue === 0 ? (
        <p className="text-[13px] text-[#8C8AA0]">Add holdings first to see how a shock would affect your real numbers.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FCEEEC] border border-[rgba(214,59,59,0.14)]">
            <p className="text-[11px] uppercase tracking-wide text-[#A02727] font-semibold mb-1.5">Portfolio drop</p>
            <p className="text-[18px] font-semibold text-[#A02727] tabular-nums">{inr(portfolioLoss)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F2F1F6] border border-[rgba(20,19,31,0.06)]">
            <p className="text-[11px] uppercase tracking-wide text-[#565469] font-semibold mb-1.5">Portfolio after shock</p>
            <p className="text-[18px] font-semibold text-[#14131F] tabular-nums">{inr(shockedPortfolio)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F2F1F6] border border-[rgba(20,19,31,0.06)]">
            <p className="text-[11px] uppercase tracking-wide text-[#565469] font-semibold mb-1.5">Net worth after shock</p>
            <p className="text-[18px] font-semibold text-[#14131F] tabular-nums">{inr(shockedNetWorth)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SipCalculator() {
  const [monthly, setMonthly] = useState("10000")
  const [rate, setRate] = useState("12")
  const [years, setYears] = useState("10")
  const [mode, setMode] = useState<"forward" | "reverse">("forward")
  const [targetCorpus, setTargetCorpus] = useState("5000000")

  const m = parseFloat(monthly) || 0
  const r = parseFloat(rate) || 0
  const y = parseFloat(years) || 0
  const target = parseFloat(targetCorpus) || 0

  const corpus = mode === "forward" ? sipFutureValue(m, r, y) : target
  const requiredSip = mode === "reverse" ? sipRequiredForTarget(target, r, y) : m
  const invested = (mode === "forward" ? m : requiredSip) * y * 12
  const gain = corpus - invested

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold text-[#14131F]">SIP calculator</h3>
        <div className="flex items-center gap-1 p-1 bg-[#F2F1F6] rounded-lg">
          {(["forward", "reverse"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`h-7 px-2.5 text-[11.5px] font-medium rounded-md transition-all ${
                mode === v ? "bg-white text-[#14131F] shadow-sm" : "text-[#565469]"
              }`}
            >
              {v === "forward" ? "Corpus" : "Required SIP"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[12.5px] text-[#8C8AA0] mb-5">
        Pure compound-interest math — the return rate is an assumption you enter, not a promise.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {mode === "forward" ? (
          <NumberField label="Monthly SIP (₹)" value={monthly} onChange={setMonthly} />
        ) : (
          <NumberField label="Target corpus (₹)" value={targetCorpus} onChange={setTargetCorpus} />
        )}
        <NumberField label="Expected return (% p.a.)" value={rate} onChange={setRate} />
        <NumberField label="Duration (years)" value={years} onChange={setYears} />
      </div>
      <div className="p-4 rounded-2xl bg-[#F4F1FB] border border-[rgba(109,85,227,0.14)] space-y-2">
        {mode === "forward" ? (
          <>
            <Row label="Total invested" value={inr(invested)} />
            <Row label="Projected corpus" value={inr(corpus)} bold />
            <Row label="Projected gain" value={inr(gain)} tone="gain" />
          </>
        ) : (
          <>
            <Row label="Required monthly SIP" value={inr(requiredSip)} bold />
            <Row label="Total invested" value={inr(invested)} />
            <Row label="Projected gain" value={inr(gain)} tone="gain" />
          </>
        )}
      </div>
    </div>
  )
}

function SwpCalculator() {
  const [corpus, setCorpus] = useState("2000000")
  const [withdrawal, setWithdrawal] = useState("15000")
  const [rate, setRate] = useState("8")

  const c = parseFloat(corpus) || 0
  const w = parseFloat(withdrawal) || 0
  const r = parseFloat(rate) || 0
  const result = swpMonthsRemaining(c, w, r)

  return (
    <div className="surface-card p-6">
      <h3 className="text-[15px] font-semibold text-[#14131F] mb-1">SWP drawdown runway</h3>
      <p className="text-[12.5px] text-[#8C8AA0] mb-5">
        How long a corpus lasts at a given monthly withdrawal and assumed return.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <NumberField label="Starting corpus (₹)" value={corpus} onChange={setCorpus} />
        <NumberField label="Monthly withdrawal (₹)" value={withdrawal} onChange={setWithdrawal} />
        <NumberField label="Expected return (% p.a.)" value={rate} onChange={setRate} />
      </div>
      <div className="p-4 rounded-2xl bg-[#F4F1FB] border border-[rgba(109,85,227,0.14)] space-y-2">
        {result.monthsLasted === null ? (
          <Row label="Runway" value={`Beyond ${(result.cappedAtMonths / 12).toFixed(0)} years — withdrawal is below the growth rate`} bold />
        ) : (
          <>
            <Row label="Runway" value={`${result.monthsLasted} months (~${(result.monthsLasted / 12).toFixed(1)} years)`} bold />
            <Row label="Total withdrawn" value={inr(w * result.monthsLasted)} />
          </>
        )}
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="section-title block mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field tabular-nums"
      />
    </div>
  )
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "gain" }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-slate-400">{label}</span>
      <span
        className={`tabular-nums ${bold ? "font-bold text-white text-[15px]" : "font-medium"} ${
          tone === "gain" ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function HoldingModal({
  initial,
  busy,
  onClose,
  onSave,
}: {
  initial: Holding | null
  busy: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    type: string
    investedAmount: number
    currentValue: number
    units: number | null
    symbol: string | null
  }) => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [type, setType] = useState(initial?.type ?? "equity_mf")
  const [investedAmount, setInvestedAmount] = useState(initial ? String(initial.investedAmount) : "")
  const [currentValue, setCurrentValue] = useState(initial ? String(initial.currentValue) : "")
  const [units, setUnits] = useState(initial?.units ? String(initial.units) : "")
  const [symbol, setSymbol] = useState(initial?.symbol ?? "")

  const refreshable = PRICE_REFRESHABLE_TYPES.has(type)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const inv = parseFloat(investedAmount)
    const cur = parseFloat(currentValue)
    if (!name.trim() || Number.isNaN(inv) || Number.isNaN(cur) || inv < 0 || cur < 0) return
    const parsedUnits = parseFloat(units)
    onSave({
      name: name.trim(),
      type,
      investedAmount: inv,
      currentValue: cur,
      units: !Number.isNaN(parsedUnits) && parsedUnits > 0 ? parsedUnits : null,
      symbol: symbol.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.form
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onSubmit={submit}
        className="relative bg-[#12151E] rounded-3xl shadow-2xl p-7 w-full max-w-md border border-white/10 text-white"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <h2 className="text-[20px] font-bold text-white tracking-tight">
          {initial ? "Edit holding" : "Add holding"}
        </h2>
        <p className="text-[13px] text-slate-400 mt-1">What you actually hold, entered by hand.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="section-title block mb-2">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="e.g. HDFC Flexicap Fund"
              className="field"
            />
          </div>
          <div>
            <label className="section-title block mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_META).map(([value, meta]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`h-8 px-3 rounded-full text-[12.5px] font-medium border transition-all ${
                    type === value
                      ? "bg-[#14131F] text-white border-[#14131F]"
                      : "bg-white text-[#565469] border-[rgba(20,19,31,0.10)] hover:border-[#4A30A8] hover:text-[#4A30A8]"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-title block mb-2">Invested amount</label>
              <div className="flex items-baseline gap-1.5 border-b-2 border-[#14131F] py-1.5">
                <span className="text-[14px] font-medium text-[#565469]">₹</span>
                <input
                  type="number"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent outline-none text-[18px] font-semibold tabular-nums text-[#14131F] placeholder:text-[#C4C2D4]"
                />
              </div>
            </div>
            <div>
              <label className="section-title block mb-2">Current value</label>
              <div className="flex items-baseline gap-1.5 border-b-2 border-[#14131F] py-1.5">
                <span className="text-[14px] font-medium text-[#565469]">₹</span>
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent outline-none text-[18px] font-semibold tabular-nums text-[#14131F] placeholder:text-[#C4C2D4]"
                />
              </div>
            </div>
          </div>

          {refreshable && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-dashed border-[rgba(20,19,31,0.12)]">
              <div className="col-span-2">
                <label className="section-title block mb-2">Units held</label>
                <input
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="e.g. 120.5"
                  className="field tabular-nums"
                />
              </div>
              <div className="col-span-2">
                <label className="section-title block mb-2">
                  {type === "stock" ? "Yahoo ticker" : "AMFI scheme code"}
                </label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder={type === "stock" ? "e.g. RELIANCE.NS" : "e.g. 118825"}
                  className="field"
                />
              </div>
              <p className="col-span-2 text-[11px] text-[#8C8AA0] -mt-1">
                Optional — add both to enable a one-click price refresh from mfapi.in or Yahoo Finance instead of updating current value by hand.
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{initial ? "Save changes" : "Add holding"}</button>
        </div>
      </motion.form>
    </div>
  )
}
