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
  const [profileName, setProfileName] = useState("Shameek Yogi")
  const [runway, setRunway] = useState<RunwaySnapshot | null>(null)

  useEffect(() => {
    if (pathname === "/login") return

    fetch("/api/settings/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name && data.name !== "Yogeesh" && data.name !== "You") {
          setProfileName(data.name)
        } else {
          setProfileName("Shameek Yogi")
        }
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
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[244px] bg-[#090A0F] border-r border-white/10 z-40 flex-col text-white"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 flex-shrink-0 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Yogi's Wealth AI home">
            <span className="w-8 h-8 rounded-[10px] bg-[#12151E] border border-emerald-500/50 flex items-center justify-center shadow-[0_2px_10px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform text-emerald-400 font-extrabold text-xs">
              YW
            </span>
            <div>
              <span className="text-[16px] font-bold tracking-tight text-white block leading-tight">
                Yogi's Wealth AI
              </span>
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider block">
                Shameek Yogi's AI Manager
              </span>
            </div>
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-5 pt-3 pb-1.5">
            <span className="section-title text-white/50">Workspace</span>
          </div>
          {mainLinks.map(renderNavItem)}

          <div className="px-5 pt-5 pb-1.5">
            <span className="section-title text-white/50">Intelligence</span>
          </div>
          {intelligenceLinks.map(renderNavItem)}
        </nav>

        {/* Runway widget */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10">
          <Link
            href="/"
            className="block mx-1.5 p-4 rounded-2xl bg-gradient-to-br from-[#12151E] via-[#1A1D2B] to-[#090A0F] border border-emerald-500/20 relative overflow-hidden hover:scale-[1.01] transition-transform shadow-lg"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
            <p className="text-[11px] uppercase tracking-[0.1em] text-emerald-400 font-bold mb-1.5 relative flex items-center gap-1.5">
              <Compass size={11} strokeWidth={2} />
              Runway Buffer
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
          <div className="flex items-center gap-3 px-2 py-3 mt-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black text-[12px] font-bold shadow-md shadow-emerald-500/20">
              {profileName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{profileName}</p>
            </div>
            <Link
              href="/settings"
              aria-label="Settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Settings size={15} strokeWidth={1.75} />
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
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
