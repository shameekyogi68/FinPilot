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
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budgets",    label: "Budgets",    icon: Wallet },
  { href: "/goals",      label: "Goals",      icon: Target },
  { href: "/analytics",  label: "Analytics",  icon: PieChart },
  { href: "/ai-advisor", label: "AI Advisor", icon: BrainCircuit },
  { href: "/settings",   label: "Settings",   icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* ─── Desktop: Fixed Left Sidebar ─── */}
      <aside
        className="fp-sidebar hidden lg:flex"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 flex-shrink-0">
          <span
            className="text-[18px] font-semibold text-[#7C3AED] tracking-tight select-none"
            aria-label="FinPilot"
          >
            FinPilot
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {links.filter(l => l.href !== "/settings").map((link) => {
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
                className={`nav-item w-full${isActive ? " active" : ""}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-[#F5F3FF] rounded-[8px] -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className={isActive ? "text-[#7C3AED]" : "text-[#8B89A0]"}
                  aria-hidden="true"
                />
                <span className="leading-none">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom: Settings + Avatar */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-[rgba(0,0,0,0.06)] pt-3">
          {(() => {
            const settingsLink = links.find(l => l.href === "/settings")!
            const Icon = settingsLink.icon
            const isActive = pathname === "/settings"
            return (
              <Link
                href="/settings"
                aria-label="Settings"
                aria-current={isActive ? "page" : undefined}
                className={`nav-item w-full${isActive ? " active" : ""}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-[#F5F3FF] rounded-[8px] -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className={isActive ? "text-[#7C3AED]" : "text-[#8B89A0]"}
                  aria-hidden="true"
                />
                <span className="leading-none">Settings</span>
              </Link>
            )
          })()}

          {/* User avatar */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div
              className="w-8 h-8 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-[11px] font-semibold text-[#6D28D9] leading-none select-none">SY</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#0F0E17] truncate leading-tight">Shameek Yogi</p>
              <p className="text-[11px] text-[#8B89A0] leading-tight">Personal account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile: Bottom Tab Bar ─── */}
      <nav
        className="fp-bottom-nav lg:hidden"
        aria-label="Main navigation"
      >
        {links.slice(0, 6).map((link) => {
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
              className="relative flex flex-col items-center justify-center w-10 h-10 rounded-[10px] transition-all duration-150"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 bg-[#F5F3FF] rounded-[10px] -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={1.5}
                className={isActive ? "text-[#7C3AED]" : "text-[#8B89A0]"}
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
