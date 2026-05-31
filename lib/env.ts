import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  API_KEY: z.string().min(1, "API_KEY is required for production").optional(),
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

// Validate API_KEY in production
if (env.NODE_ENV === "production" && !env.API_KEY) {
  console.error("❌ API_KEY is required in production")
  throw new Error("API_KEY is required in production")
}

export { env }
