// Edge-compatible session signing (Web Crypto only — no Node `crypto`/`Buffer`,
// since this is imported from middleware.ts which runs on the Edge runtime).

export const SESSION_COOKIE_NAME = "runway_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes)
  let str = ""
  for (let i = 0; i < arr.length; i += 1) str += String.fromCharCode(arr[i])
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < len; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return toBase64Url(sig)
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  const issuedAt = Date.now().toString()
  const signature = await sign(issuedAt, secret)
  return `${issuedAt}.${signature}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.AUTH_SECRET
  if (!secret || !token) return false

  const [issuedAt, signature] = token.split(".")
  if (!issuedAt || !signature) return false

  const expected = await sign(issuedAt, secret)
  if (!timingSafeEqual(expected, signature)) return false

  const age = Date.now() - Number(issuedAt)
  return Number.isFinite(age) && age >= 0 && age <= SESSION_MAX_AGE_SECONDS * 1000
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.SITE_PASSWORD
  if (!expected) return false
  return timingSafeEqual(password, expected)
}
