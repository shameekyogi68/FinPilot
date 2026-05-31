"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Target,
  PieChart,
  Wallet,
  Settings,
  BrainCircuit,
  Receipt,
} from "lucide-react"

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/ai-advisor", label: "AI Advisor", icon: BrainCircuit },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
      aria-label="Main navigation"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.2 }}
        className="bg-white border border-[hsl(var(--border))] rounded-full px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06)] backdrop-blur-sm flex items-center gap-1"
      >
        {links.map((link) => {
          const Icon = link.icon
          const isActive =
            pathname === link.href ||
            (pathname.startsWith(link.href) && link.href !== "/")

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col sm:flex-row items-center gap-1 px-3 py-2 rounded-full text-[9px] sm:text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                isActive
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-[hsl(var(--primary))] rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon strokeWidth={1.5} className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{link.label.split(" ")[0]}</span>
            </Link>
          )
        })}
      </motion.div>
    </nav>
  )
}
