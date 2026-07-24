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
