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
        style={{
          background: "rgba(10, 10, 15, 0.8)",
          backdropFilter: "blur(32px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 flex-shrink-0">
          <span
            className="flex items-center gap-2 text-[18px] font-semibold text-[#7C3AED] tracking-tight select-none"
            aria-label="FinPilot"
          >
            {/* Gradient accent dot */}
            <span
              className="inline-block w-[9px] h-[9px] rounded-full flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)",
                boxShadow: "0 0 8px rgba(124, 58, 237, 0.35)",
              }}
              aria-hidden="true"
            />
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
              <motion.div
                key={link.href}
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link
                  href={link.href}
                  aria-label={link.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`nav-item w-full${isActive ? " active" : ""}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-[8px] -z-10"
                      style={{
                        background: "linear-gradient(90deg, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0.05) 100%)",
                        border: "1px solid rgba(167,139,250,0.2)"
                      }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  {/* Active left accent bar */}
                  {isActive && (
                    <motion.span
                      className="absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-full"
                      style={{
                        background: "linear-gradient(180deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)",
                      }}
                      layoutId="nav-accent-bar"
                      initial={{ opacity: 0, scaleY: 0.5 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className={isActive ? "text-[#a78bfa]" : "text-[#a1a1aa] group-hover:text-[#fafafa]"}
                    aria-hidden="true"
                  />
                  <span className="leading-none">{link.label}</span>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Bottom: Settings + Avatar */}
        <div
          className="px-3 pb-4 space-y-0.5 pt-3"
          style={{
            borderTop: "1px solid transparent",
            borderImage: "linear-gradient(90deg, transparent, rgba(124,58,237,0.12), transparent) 1",
          }}
        >
          {(() => {
            const settingsLink = links.find(l => l.href === "/settings")!
            const Icon = settingsLink.icon
            const isActive = pathname === "/settings"
            return (
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link
                  href="/settings"
                  aria-label="Settings"
                  aria-current={isActive ? "page" : undefined}
                  className={`nav-item w-full${isActive ? " active" : ""}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-[8px] -z-10"
                      style={{
                        background: "linear-gradient(90deg, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0.05) 100%)",
                        border: "1px solid rgba(167,139,250,0.2)"
                      }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  {isActive && (
                    <motion.span
                      className="absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-full"
                      style={{
                        background: "linear-gradient(180deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)",
                      }}
                      layoutId="nav-accent-bar"
                      initial={{ opacity: 0, scaleY: 0.5 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className={isActive ? "text-[#7C3AED]" : "text-[#a1a1aa]"}
                    aria-hidden="true"
                  />
                  <span className="leading-none">Settings</span>
                </Link>
              </motion.div>
            )
          })()}

          {/* User avatar */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div
              className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                boxShadow: "0 0 0 2px rgba(124, 58, 237, 0.12), 0 0 10px rgba(124, 58, 237, 0.08)",
              }}
              aria-hidden="true"
            >
              <span className="text-[11px] font-semibold text-[#6D28D9] leading-none select-none">SY</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#fafafa] truncate leading-tight">Shameek Yogi</p>
              <p className="text-[11px] text-[#a1a1aa] leading-tight">Personal account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile: Bottom Tab Bar ─── */}
      <nav
        className="fp-bottom-nav lg:hidden"
        aria-label="Main navigation"
        style={{
          background: "rgba(20, 20, 25, 0.72)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.4)",
        }}
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
                  className="absolute inset-0 rounded-[10px] -z-10"
                  style={{
                    background: "linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(124,58,237,0.10) 100%)",
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={1.5}
                className={isActive ? "text-[#7C3AED]" : "text-[#a1a1aa]"}
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
