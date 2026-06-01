import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  POSTGRES_PRISMA_URL: z.string().min(1, "POSTGRES_PRISMA_URL is required"),
  POSTGRES_URL_NON_POOLING: z.string().min(1, "POSTGRES_URL_NON_POOLING is required").optional(),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required for production").optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  )
  throw new Error("Invalid environment variables")
}

const env = parsed.data

// Validate OPENROUTER_API_KEY in production
if (env.NODE_ENV === "production" && !env.OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY is required in production")
  throw new Error("OPENROUTER_API_KEY is required in production")
}

export { env }
