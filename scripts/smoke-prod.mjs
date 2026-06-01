const baseUrl = process.env.SMOKE_BASE_URL ?? "https://fin-pilot-chi.vercel.app"

const sameOriginHeaders = {
  Referer: `${baseUrl}/`,
}

const checks = [
  { name: "home page", path: "/" },
  { name: "dashboard metrics", path: "/api/dashboard/metrics", headers: sameOriginHeaders },
  { name: "dashboard expenses", path: "/api/dashboard/expenses", headers: sameOriginHeaders },
  { name: "recent transactions", path: "/api/transactions?limit=5", headers: sameOriginHeaders },
  { name: "AI insights", path: `/api/insights?month=${new Date().toISOString().slice(0, 7)}`, headers: sameOriginHeaders },
]

async function runCheck(check) {
  const url = new URL(check.path, baseUrl)
  const response = await fetch(url, { headers: check.headers })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`${check.name} failed with ${response.status}: ${body.slice(0, 200)}`)
  }

  return `${check.name}: ${response.status}`
}

const results = await Promise.all(checks.map(runCheck))
console.log(results.join("\n"))
