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

const mainLinks = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budgets",    label: "Budgets",    icon: Wallet },
  { href: "/goals",      label: "Goals",      icon: Target },
  { href: "/analytics",  label: "Analytics",  icon: PieChart },
]

const intelligenceLinks = [
  { href: "/ai-advisor", label: "AI Advisor", icon: BrainCircuit },
]

const allLinks = [
  ...mainLinks,
  ...intelligenceLinks,
  { href: "/settings",   label: "Settings",   icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  const renderNavItem = (link: typeof allLinks[0]) => {
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
              className="absolute inset-0 rounded-[10px] -z-10"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(139,92,246,0.06))",
              }}
              initial={false}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          {isActive && (
            <motion.span
              className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-[4px]"
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
            strokeWidth={2}
            className={isActive ? "text-[#7C3AED]" : "text-[#8B89A0]"}
            aria-hidden="true"
          />
          <span className="leading-none">{link.label}</span>
        </Link>
      </motion.div>
    )
  }

  return (
    <>
      {/* ─── Desktop: Fixed Left Sidebar ─── */}
      <aside
        className="fp-sidebar hidden lg:flex"
        aria-label="Main navigation"
      >
        {/* Logo Banner */}
        <div className="h-16 flex items-center px-5 flex-shrink-0">
          <span
            className="flex items-center gap-2.5 text-[18px] font-bold text-[#0F0E17] tracking-tight select-none"
            aria-label="FinPilot"
          >
            <span className="inline-flex w-8 h-8 rounded-[10px] items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#A78BFA] to-[#6D28D9] shadow-[0_4px_12px_rgba(124,58,237,0.30)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M2 12h20M17 7l-5-5-5 5M17 17l-5 5-5-5"/>
              </svg>
            </span>
            <span className="text-gradient">FinPilot</span>
          </span>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {/* Main Section */}
          <div className="px-4 pb-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#B8B5C9]">Main</span>
          </div>
          {mainLinks.map(renderNavItem)}

          {/* Intelligence Section */}
          <div className="px-4 pb-2 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#B8B5C9]">Intelligence</span>
          </div>
          {intelligenceLinks.map(renderNavItem)}
        </nav>

        {/* Bottom User Profile & Settings */}
        <div className="px-3 pb-5 pt-3 border-t border-dashed border-[rgba(0,0,0,0.06)]">
          {/* Settings */}
          {renderNavItem({ href: "/settings", label: "Settings", icon: Settings })}

          {/* User Account Card */}
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-[14px] bg-gradient-to-r from-[rgba(124,58,237,0.05)] to-transparent border border-[rgba(124,58,237,0.08)]">
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] shadow-[0_0_0_2px_rgba(124,58,237,0.15),0_2px_8px_rgba(124,58,237,0.15)]">
              <span className="text-[11px] font-bold text-[#6D28D9] leading-none select-none">SY</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0F0E17] truncate leading-tight">Shameek Yogi</p>
              <p className="text-[11px] text-[#8B89A0] leading-tight">Premium Member</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          </div>
        </div>
      </aside>

      {/* ─── Mobile: Bottom Tab Bar ─── */}
      <nav
        className="fp-bottom-nav lg:hidden"
        aria-label="Main navigation"
      >
        {allLinks.map((link) => {
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
              className={`mobile-tab${isActive ? " active" : ""}`}
            >
              <Icon
                size={20}
                strokeWidth={2}
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
