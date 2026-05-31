import { NextResponse } from "next/server"
import { logger } from "./logger"

// Simple API key authentication for production
// In development, we allow requests without authentication
export function authenticateRequest(request: Request): NextResponse | null {
  const isDevelopment = process.env.NODE_ENV === "development"
  
  if (isDevelopment) {
    return null // Allow all requests in development
  }

  const apiKey = request.headers.get("x-api-key")
  const validApiKey = process.env.API_KEY

  if (!validApiKey) {
    logger.error("API_KEY environment variable not set in production")
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn("Unauthorized API access attempt", { 
      ip: request.headers.get("x-forwarded-for") || "unknown" 
    })
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  return null // Request is authenticated
}

// Rate limiting utility
type RateLimitEntry = {
  count: number
  windowStart: number
}

type RateLimitStore = {
  __rateLimits?: Map<string, RateLimitEntry>
}

const getRateLimitStore = (): Map<string, RateLimitEntry> => {
  const globalState = globalThis as unknown as RateLimitStore
  if (!globalState.__rateLimits) {
    globalState.__rateLimits = new Map()
  }
  return globalState.__rateLimits
}

export function checkRateLimit(
  request: Request,
  maxRequests: number = 100,
  windowMs: number = 60_000
): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "global"
  
  const store = getRateLimitStore()
  const now = Date.now()
  const entry = store.get(ip) ?? { count: 0, windowStart: now }

  // Reset if window has expired
  if (now - entry.windowStart > windowMs) {
    entry.count = 0
    entry.windowStart = now
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    logger.warn("Rate limit exceeded", { ip })
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    )
  }

  // Increment counter
  entry.count += 1
  store.set(ip, entry)

  return null // Request is within rate limit
}

// Safe error response that doesn't leak sensitive information
export function safeErrorResponse(error: unknown, context: string = "Operation"): NextResponse {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Log the full error for debugging
  logger.error(`${context} failed`, { error: errorMessage })
  
  // Return a generic error message to the client
  const isDevelopment = process.env.NODE_ENV === "development"
  
  if (isDevelopment) {
    // In development, return more details for debugging
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
  
  // In production, return generic error message
  return NextResponse.json(
    { error: `${context} failed. Please try again.` },
    { status: 500 }
  )
}
