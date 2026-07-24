"use client"

import { useState } from "react"
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sliders,
  TrendingUp,
  Download,
} from "lucide-react"
import { type MonthlyPlanWizardData } from "@/services/ai/wealthManagerEngine"

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val)

export function MonthlyWealthWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState(1)
  const [incomeInput, setIncomeInput] = useState("100000")
  const [plan, setPlan] = useState<MonthlyPlanWizardData | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGeneratePlan = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/wealth-manager/monthly-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income: parseFloat(incomeInput) || 100000 }),
      })

      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        setStep(2)
      }
    } catch (e) {
      console.error("Error generating plan", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in">
      <div className="w-full max-w-2xl bg-[#090A0F] border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold">Monthly Wealth Execution Plan</h2>
              <p className="text-[12px] text-white/60">Step {step} of 3 • Autonomous Wealth Strategy</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: Income Input */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <label className="text-[13px] font-semibold text-white/90 block">
                Total Projected Income / Cash Inflow for the Month (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-[18px] font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder="100000"
                  className="w-full pl-9 pr-4 py-3 bg-black/50 border border-emerald-500/40 rounded-xl text-[20px] font-bold text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <p className="text-[11.5px] text-white/50">
                Log your salary, freelance earnings, dividends, or business inflows for exact allocation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-emerald-200 leading-relaxed">
                The Autonomous Wealth Manager will partition your cashflow into mandatory obligations, safety buffer preservation, equity/debt mutual funds, and cap your daily spending allowance.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 text-[13.5px] font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[13.5px] font-bold flex items-center gap-2 hover:opacity-95 transition-opacity"
              >
                {loading ? "Calculating Blueprint…" : "Generate Execution Blueprint"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Allocation & Mutual Fund Breakdown */}
        {step === 2 && plan && (
          <div className="space-y-5">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/50 uppercase font-semibold block mb-1">
                  Inflow
                </span>
                <span className="text-[16px] font-bold text-white tabular-nums">
                  ₹{formatCurrency(plan.projectedIncome)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/50 uppercase font-semibold block mb-1">
                  Essentials
                </span>
                <span className="text-[16px] font-bold text-white/80 tabular-nums">
                  ₹{formatCurrency(plan.essentialExpenses)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1">
                  Investments
                </span>
                <span className="text-[16px] font-bold text-emerald-400 tabular-nums">
                  ₹{formatCurrency(plan.targetInvestments.totalInvestment)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 uppercase font-semibold block mb-1">
                  Daily Spend Cap
                </span>
                <span className="text-[16px] font-bold text-amber-300 tabular-nums">
                  ₹{formatCurrency(plan.dailySpendCap)}/day
                </span>
              </div>
            </div>

            {/* Investment Allocation Matrix */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Target Mutual Funds & Asset Allocation
              </h3>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                  <span className="text-white/80">Equity Mutual Funds (Flexi & Small Cap)</span>
                  <span className="font-bold text-emerald-400">
                    ₹{formatCurrency(plan.targetInvestments.equityMf)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                  <span className="text-white/80">Debt / Arbitrage Mutual Funds (Liquid)</span>
                  <span className="font-bold text-teal-300">
                    ₹{formatCurrency(plan.targetInvestments.debtMf)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                  <span className="text-white/80">Sovereign Gold Bond / Gold ETF</span>
                  <span className="font-bold text-amber-300">
                    ₹{formatCurrency(plan.targetInvestments.gold)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Advisor note */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[12.5px] text-emerald-200">
              💡 {plan.aiStrategyNote}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 text-[13px] flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black text-[13.5px] font-bold flex items-center gap-2 hover:bg-emerald-400"
              >
                View Final Action Plan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Action Execution Checklist */}
        {step === 3 && plan && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <h3 className="text-[15px] font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Monthly Execution Blueprint Committed
              </h3>
              <p className="text-[12.5px] text-emerald-100 leading-relaxed">
                Follow these 4 automated wealth directives to stay on track for financial freedom this month.
              </p>
            </div>

            <div className="space-y-2">
              {plan.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-[13px] text-white/90"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 text-[13px] flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export / Print Plan
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black text-[13.5px] font-bold hover:bg-emerald-400"
              >
                Complete & Execute
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
