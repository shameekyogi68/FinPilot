const PALETTE = [
  "#6D55E3", "#A48FF6", "#3D9BD0", "#E89B3C", "#18A87E", "#E04B4B", "#0EA5E9", "#8B5CF6", "#9A98AC",
]

export function categoryColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
