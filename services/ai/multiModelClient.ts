export type OpenRouterMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// Primary and fallback free AI models for high availability and consensus engine
const FREE_MODELS = [
  process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  "google/gemini-2.5-flash:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "deepseek/deepseek-r1-distill-llama-70b:free",
]

const REQUEST_TIMEOUT_MS = 25_000

export async function callMultiModelAI(
  messages: OpenRouterMessage[],
  temperature = 0.3,
  maxTokens = 1000
): Promise<{ text: string; modelUsed: string }> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const errors: string[] = []

  for (const model of FREE_MODELS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://finpilot.local",
          "X-Title": "FinPilot Autonomous Wealth Manager",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        errors.push(`[${model}] Status ${response.status}: ${errorText.slice(0, 100)}`)
        continue
      }

      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content ?? data?.output?.[0]?.content

      if (content && typeof content === "string" && content.trim().length > 0) {
        return {
          text: content.trim(),
          modelUsed: model,
        }
      }
    } catch (err: any) {
      clearTimeout(timer)
      errors.push(`[${model}] Error: ${err?.message || "Unknown error"}`)
    }
  }

  throw new Error(`All AI models failed. Attempts log: ${errors.join(" | ")}`)
}
