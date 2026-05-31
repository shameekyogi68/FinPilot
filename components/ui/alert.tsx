"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = {
  default:
    "border-border bg-background text-foreground shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200",
  destructive:
    "border-destructive/30 bg-destructive/10 text-destructive shadow-sm dark:border-destructive/50 dark:bg-destructive/20 dark:text-destructive-foreground",
  warning:
    "border-amber-300 bg-amber-100 text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  success:
    "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
}

const alertIcons = {
  default: Info,
  destructive: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
}

type AlertProps = React.ComponentProps<"div"> & {
  variant?: keyof typeof alertVariants
}

function Alert({ className, variant = "default", ...props }: AlertProps) {
  const Icon = alertIcons[variant] || Info

  return (
    <div className={cn("relative grid gap-3 rounded-lg border p-4 md:grid-cols-[auto_1fr]", alertVariants[variant], className)} {...props}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-current shadow-sm dark:bg-slate-950/80">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        {props.children}
      </div>
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={cn("text-sm font-semibold leading-none", className)} {...props} />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-sm leading-snug text-slate-600 dark:text-slate-400", className)} {...props} />
  )
}

export { Alert, AlertDescription, AlertTitle }
