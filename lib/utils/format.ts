export const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

export const inrShort = (n: number): string => {
  const abs = Math.abs(n)
  if (abs >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)}Cr`
  if (abs >= 1_00_000) return `${(n / 1_00_000).toFixed(2)}L`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}
