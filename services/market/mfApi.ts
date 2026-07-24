export type MFSearchResult = {
  schemeCode: number
  schemeName: string
}

export type MFDetails = {
  meta: {
    fund_house: string
    scheme_type: string
    scheme_category: string
    scheme_code: number
    scheme_name: string
  }
  currentNav: number
  latestDate: string
  cagr1Y: number | null
  cagr3Y: number | null
  cagr5Y: number | null
  navHistorySample: Array<{ date: string; nav: number }>
}

export async function searchMutualFunds(query: string): Promise<MFSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query.trim())}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) return []

    const data = await res.json()
    if (!Array.isArray(data)) return []

    return data.slice(0, 15).map((item: any) => ({
      schemeCode: Number(item.schemeCode),
      schemeName: String(item.schemeName),
    }))
  } catch (error) {
    console.error("Failed to search mutual funds:", error)
    return []
  }
}

export async function getMutualFundDetails(schemeCode: number | string): Promise<MFDetails | null> {
  const code = String(schemeCode).trim()
  if (!code || isNaN(Number(code))) return null

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${code}`, {
      next: { revalidate: 1800 },
    })

    if (!res.ok) return null

    const payload = await res.json()
    if (!payload?.data || !Array.isArray(payload.data) || payload.data.length === 0) {
      return null
    }

    const navData: Array<{ date: string; nav: number }> = payload.data.map((d: any) => ({
      date: String(d.date),
      nav: parseFloat(d.nav),
    }))

    const latest = navData[0]
    const currentNav = latest.nav

    // Calculate CAGR helper
    const getNavYearsAgo = (years: number): number | null => {
      if (navData.length < years * 200) return null
      const targetIdx = Math.min(navData.length - 1, Math.floor(years * 252))
      return navData[targetIdx]?.nav || null
    }

    const calcCagr = (years: number): number | null => {
      const pastNav = getNavYearsAgo(years)
      if (!pastNav || pastNav <= 0) return null
      return Math.round(((Math.pow(currentNav / pastNav, 1 / years) - 1) * 100) * 100) / 100
    }

    return {
      meta: {
        fund_house: payload.meta?.fund_house || "Mutual Fund",
        scheme_type: payload.meta?.scheme_type || "Equity",
        scheme_category: payload.meta?.scheme_category || "Other",
        scheme_code: Number(payload.meta?.scheme_code || code),
        scheme_name: payload.meta?.scheme_name || `Scheme ${code}`,
      },
      currentNav,
      latestDate: latest.date,
      cagr1Y: calcCagr(1),
      cagr3Y: calcCagr(3),
      cagr5Y: calcCagr(5),
      navHistorySample: navData.slice(0, 30),
    }
  } catch (error) {
    console.error(`Failed to fetch MF details for ${schemeCode}:`, error)
    return null
  }
}
