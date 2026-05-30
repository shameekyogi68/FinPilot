import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  barClassName,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  value: number
  barClassName?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div
        className={cn("h-2 rounded-full transition-all", barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export { Progress }
