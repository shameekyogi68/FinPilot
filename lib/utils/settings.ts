export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "JPY"

const currencySymbols: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "$",
  AUD: "$",
  JPY: "¥",
}

export function getCurrencySymbol(currency: CurrencyCode) {
  return currencySymbols[currency] ?? "$"
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return formatted
}

export function updateCurrencyInAllAmounts(currency: CurrencyCode) {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("finpilot-currency", currency)
    window.dispatchEvent(
      new CustomEvent("finpilot:currency-changed", {
        detail: { currency },
      })
    )
  } catch {
    // best effort only
  }
}
