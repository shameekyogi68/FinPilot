// Deterministic compound-interest math — no AI/model involved, just formulas.

export function sipFutureValue(monthlyAmount: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (n <= 0) return 0
  if (r === 0) return monthlyAmount * n
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

export function sipRequiredForTarget(targetAmount: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (n <= 0) return 0
  if (r === 0) return targetAmount / n
  return targetAmount / (((Math.pow(1 + r, n) - 1) / r) * (1 + r))
}

export type SwpResult = {
  monthsLasted: number | null // null means it never depletes within the cap
  cappedAtMonths: number
}

export function swpMonthsRemaining(
  corpus: number,
  monthlyWithdrawal: number,
  annualRatePct: number,
  capMonths = 1200
): SwpResult {
  const r = annualRatePct / 100 / 12
  let balance = corpus
  let months = 0

  while (balance > 0 && months < capMonths) {
    balance = balance * (1 + r) - monthlyWithdrawal
    months += 1
    if (r <= 0 && monthlyWithdrawal <= 0) break
  }

  if (balance > 0 && months >= capMonths) {
    return { monthsLasted: null, cappedAtMonths: capMonths }
  }

  return { monthsLasted: months, cappedAtMonths: capMonths }
}

/**
 * Real historical CAGR from an actual NAV history (newest-first), not a projection.
 * Returns null if there isn't enough history to cover the requested period.
 */
export function historicalCagr(history: { date: Date; nav: number }[], years: number): number | null {
  if (history.length === 0) return null

  const latest = history[0]
  const targetDate = new Date(latest.date)
  targetDate.setFullYear(targetDate.getFullYear() - years)

  // history is newest-first; find the first entry at or before targetDate.
  const past = history.find((point) => point.date.getTime() <= targetDate.getTime())
  if (!past || past.nav <= 0) return null

  // Require the match to be reasonably close to the target (within ~10 days) so we don't
  // silently compute a "5yr" return off a fund that's only 4 years old.
  const gapDays = Math.abs(past.date.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  if (gapDays > 10) return null

  return (Math.pow(latest.nav / past.nav, 1 / years) - 1) * 100
}
