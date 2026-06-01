import { existsSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return null

  const equalsIndex = trimmed.indexOf("=")
  if (equalsIndex === -1) return null

  const key = trimmed.slice(0, equalsIndex).trim()
  let value = trimmed.slice(equalsIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return [key, value]
}

for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue

    const [key, value] = parsed
    process.env[key] ??= value
  }
}

const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
})

process.exit(result.status ?? 1)
