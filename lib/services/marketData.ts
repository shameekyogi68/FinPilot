// Free, no-key market data lookups. Best-effort only — used for optional
// "refresh price" actions, never automatically trusted without the user
// clicking to pull a fresh number.

export type PriceQuote = {
  price: number
  asOf: string
  source: "mfapi" | "yahoo"
}

const FETCH_TIMEOUT_MS = 8_000

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** schemeCode is the AMFI scheme code used by mfapi.in, e.g. "118825". */
export async function fetchMutualFundNav(schemeCode: string): Promise<PriceQuote> {
  const res = await fetchWithTimeout(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`)
  if (!res.ok) {
    throw new Error(`mfapi.in request failed (${res.status})`)
  }
  const json = await res.json().catch(() => null)
  const latest = json?.data?.[0]
  const nav = latest?.nav ? Number(latest.nav) : NaN
  if (!latest || Number.isNaN(nav)) {
    throw new Error("No NAV data returned for this scheme code")
  }
  return { price: nav, asOf: latest.date, source: "mfapi" }
}

/** symbol is a Yahoo Finance ticker, e.g. "RELIANCE.NS" or "TCS.NS" for NSE, "AAPL" for US. */
export async function fetchStockPrice(symbol: string): Promise<PriceQuote> {
  const res = await fetchWithTimeout(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  )
  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed (${res.status})`)
  }
  const json = await res.json().catch(() => null)
  const meta = json?.chart?.result?.[0]?.meta
  const price = meta?.regularMarketPrice
  if (typeof price !== "number") {
    throw new Error("No price data returned for this symbol")
  }
  return {
    price,
    asOf: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
    source: "yahoo",
  }
}

export type FundHistoryPoint = { date: Date; nav: number }
export type FundHistory = {
  schemeCode: string
  schemeName: string
  fundHouse: string
  category: string
  history: FundHistoryPoint[] // newest first
}

function parseMfapiDate(ddmmyyyy: string): Date {
  const [d, m, y] = ddmmyyyy.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Full NAV history for a mutual fund, oldest-first isn't guaranteed by the API — we return newest-first as given. */
export async function fetchMutualFundHistory(schemeCode: string): Promise<FundHistory> {
  const res = await fetchWithTimeout(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`)
  if (!res.ok) {
    throw new Error(`mfapi.in request failed (${res.status})`)
  }
  const json = await res.json().catch(() => null)
  const rows: Array<{ date: string; nav: string }> = json?.data ?? []
  if (rows.length === 0) {
    throw new Error("No historical data returned for this scheme code")
  }

  return {
    schemeCode,
    schemeName: json?.meta?.scheme_name ?? "Unknown scheme",
    fundHouse: json?.meta?.fund_house ?? "Unknown",
    category: json?.meta?.scheme_category ?? "Unknown",
    history: rows
      .map((r) => ({ date: parseMfapiDate(r.date), nav: Number(r.nav) }))
      .filter((r) => !Number.isNaN(r.nav)),
  }
}

export async function fetchLatestPrice(type: string, symbol: string): Promise<PriceQuote> {
  if (type === "equity_mf" || type === "debt_mf") {
    return fetchMutualFundNav(symbol)
  }
  if (type === "stock") {
    return fetchStockPrice(symbol)
  }
  throw new Error(`Price refresh isn't supported for holding type "${type}"`)
}
