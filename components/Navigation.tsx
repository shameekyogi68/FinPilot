"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Target,
  PieChart,
  Wallet,
  Settings,
  BrainCircuit,
  Receipt,
  Compass,
  TrendingUp,
  LogOut,
} from "lucide-react"

const mainLinks = [
  { href: "/",            label: "Overview",     icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budgets",     label: "Budgets",      icon: Wallet },
  { href: "/investments", label: "Investments",  icon: TrendingUp },
  { href: "/goals",       label: "Goals",        icon: Target },
  { href: "/analytics",   label: "Analytics",    icon: PieChart },
]

const intelligenceLinks = [
  { href: "/ai-advisor",  label: "AI Advisor",   icon: BrainCircuit },
]

const allLinks = [
  ...mainLinks,
  ...intelligenceLinks,
  { href: "/settings",    label: "Settings",     icon: Settings },
]

type RunwaySnapshot = { runwayMonths: number | null; safetyBufferTargetMonths: number; bufferGap: number }

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [profileName, setProfileName] = useState("You")
  const [runway, setRunway] = useState<RunwaySnapshot | null>(null)

  useEffect(() => {
    if (pathname === "/login") return

    fetch("/api/settings/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) setProfileName(data.name)
      })
      .catch(() => {})

    fetch("/api/dashboard/runway")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setRunway(data)
      })
      .catch(() => {})
  }, [pathname])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  if (pathname === "/login") return null

  const renderNavItem = (link: typeof allLinks[0]) => {
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
        className={`nav-item ${isActive ? "active" : ""}`}
      >
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
        <span>{link.label}</span>
      </Link>
    )
  }

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[244px] bg-white border-r border-[rgba(20,19,31,0.06)] z-40 flex-col"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="FinPilot home">
            <span className="w-8 h-8 rounded-[10px] bg-[#090A0F] border border-emerald-500/30 flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform text-emerald-400 font-extrabold text-sm">
              FP
            </span>
            <div>
              <span className="text-[17px] font-bold tracking-tight text-[#14131F] block leading-tight">
                FinPilot
              </span>
              <span className="text-[9.5px] uppercase font-semibold text-emerald-600 tracking-wider block">
                AI Wealth Manager
              </span>
            </div>
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-5 pt-3 pb-1.5">
            <span className="section-title">Workspace</span>
          </div>
          {mainLinks.map(renderNavItem)}

          <div className="px-5 pt-5 pb-1.5">
            <span className="section-title">Intelligence</span>
          </div>
          {intelligenceLinks.map(renderNavItem)}
        </nav>

        {/* Runway widget */}
        <div className="px-3 pb-4 pt-3 border-t border-dashed border-[rgba(20,19,31,0.08)]">
          <Link
            href="/"
            className="block mx-1.5 p-4 rounded-2xl bg-gradient-to-br from-[#14131F] to-[#2A2740] relative overflow-hidden hover:scale-[1.01] transition-transform"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#6D55E3] opacity-20 blur-2xl" />
            <p className="text-[11px] uppercase tracking-[0.1em] text-white/60 font-semibold mb-1.5 relative flex items-center gap-1.5">
              <Compass size={11} strokeWidth={2} />
              Runway
            </p>
            <p className="text-[20px] font-semibold text-white leading-tight relative">
              {runway?.runwayMonths !== null && runway?.runwayMonths !== undefined
                ? `${runway.runwayMonths.toFixed(1)} months`
                : "—"}
            </p>
            <p className="text-[11.5px] text-white/60 leading-snug mt-1 relative">
              {runway
                ? runway.bufferGap > 0
                  ? `${(runway.bufferGap / 1000).toFixed(0)}k short of your ${runway.safetyBufferTargetMonths}-month buffer target`
                  : "Your safety buffer target is fully covered"
                : "Loading your buffer…"}
            </p>
          </Link>

          {/* User row */}
          <div className="flex items-center gap-3 px-2 py-3 mt-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A48FF6] to-[#6D55E3] flex items-center justify-center text-white text-[12px] font-semibold">
              {profileName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#14131F] truncate">{profileName}</p>
            </div>
            <Link
              href="/settings"
              aria-label="Settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#F4F1FB] hover:text-[#14131F] transition-colors"
            >
              <Settings size={15} strokeWidth={1.75} />
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8AA0] hover:bg-[#FCEEEC] hover:text-[#A02727] transition-colors"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <nav className="bottom-nav lg:hidden" aria-label="Main navigation">
        {allLinks.slice(0, 6).map((link) => {
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
              className={`mobile-tab ${isActive ? "active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
