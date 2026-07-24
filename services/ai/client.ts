const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash"
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

const createTimeout = (timeout: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  }
}

const shouldRetry = (status: number) => {
  return status === 429 || status === 502 || status === 503 || status === 504
}

export async function callOpenRouterChat(messages: OpenRouterMessage[]): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY")
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const timeout = createTimeout(REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 800,
        }),
        signal: timeout.signal,
      })

      const text = await response.text()
      let payload: any = null

      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        payload = null
      }

      if (!response.ok) {
        const message = payload?.error || payload?.message || text || `OpenRouter request failed with status ${response.status}`

        if (shouldRetry(response.status) && attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
          continue
        }

        throw new Error(`OpenRouter error: ${message}`)
      }

      const content = payload?.choices?.[0]?.message?.content ?? payload?.output?.[0]?.content

      if (!content || typeof content !== "string") {
        throw new Error("OpenRouter returned an unexpected response format")
      }

      return content.trim()
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
          continue
        }

        throw new Error("OpenRouter request timed out")
      }

      if (error instanceof Error && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
        continue
      }

      throw error
    } finally {
      timeout.clear()
    }
  }

  throw new Error("OpenRouter request failed after retries")
}
