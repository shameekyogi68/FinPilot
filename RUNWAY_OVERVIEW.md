# Runway — Project Overview

_A personal wealth manager built for one person: you. Designed around floating/irregular income rather than a fixed monthly paycheck._

---

## 1. What this is

Runway is a private, single-user web app that replaced the old "FinPilot" demo shell. Where the old version ran on fake hardcoded numbers, Runway is wired end-to-end to a real database — everything you enter is actually saved, and every number on screen is computed from your real data.

It's built around one core idea: **your income isn't a fixed monthly number, so your budgeting shouldn't assume it is.** Instead of "you make ₹X/month," Runway tracks your trailing average income/expenses, tells you how many months of runway your current balance covers, and separates "essential" spending (must survive a lean month) from flexible spending.

It is **not** a licensed financial advisor and doesn't place trades or connect to a broker. It's an analyst-assistant: it tracks, calculates, and explains — using your real numbers — but decisions stay with you.

---

## 2. What's inside (features)

| Area | What it does |
|---|---|
| **Dashboard (Overview)** | Net balance, real weekly cash flow chart, Net Worth (cash + investments), income/expense month-to-date, savings rate, budget utilization, **Runway** (months of buffer at your real burn rate), recent transactions, AI-generated insights. |
| **Transactions** | Add/edit/delete income & expense entries with category, note, date. Real-time totals. |
| **Budgets** | Monthly category limits, marked **essential** or **flexible** — essential budgets form your "must-cover" floor even in a low-income month. |
| **Goals** | Savings goals with target amount, deadline, progress ring, "add funds" flow. |
| **Investments** | Manual portfolio tracker — stocks, mutual funds, FDs, PPF, gold, other. Shows invested vs. current value, gain/loss, and **current vs. target allocation** (targets you set yourself in Settings — not a recommendation), with a **rebalance flag** when a category drifts past your own configured threshold. Optional **one-click price refresh** for stocks and mutual funds using free live market data (see below) instead of updating current value by hand. Calculators: SIP corpus projection (both directions), SWP drawdown runway, a **drawdown stress test** (what a −10% to −50% equity shock does to your real portfolio and net worth today), and a **cost-of-overspending** card computed from your actual trailing non-essential-budget overspend, run through the same compound-interest math. All pure math, no AI involved. |
| **Analytics** | 6-month income/expense trend, monthly net-savings bars, daily spending heatmap, category breakdown — all from real transaction history. |
| **AI Advisor** | Chat interface backed by a real LLM call (see below) with full context of your actual transactions, budgets, goals, runway, and portfolio. Framed to analyze and explain, not to issue personalized buy/sell calls. |
| **Monthly review** (new) | A short AI-generated review — cash flow, budget variance, allocation drift, goal/runway status — that regenerates itself automatically on the 1st of each month (via a scheduled job) and appears on the Dashboard next time you open it. No prompting required. Falls back to a rule-based summary if the AI call fails, so it's never blank. |
| **Settings** | Profile, currency, income-averaging window, safety-buffer target (in months), **risk profile presets** (Conservative/Balanced/Aggressive — pre-fill target allocation + rebalance threshold, purely a labeled starting point you can edit), target asset allocation, data export (CSV/JSON/PDF), backup & restore, delete-everything. |

---

## 3. How the "floating income" logic works

- **Runway** = current balance ÷ average monthly expense (trailing window, configurable — default 3 months, skips the current still-incomplete month).
- **Income volatility** — flagged as steady / variable / highly variable based on how much your monthly income swings over that window.
- **Essential floor** — sum of budgets marked "essential"; the amount you need covered no matter how thin a month is.
- **Safety buffer target** — a number of months' expenses you want banked (you set this); the dashboard shows how far off you are.
- **Net worth** = cash balance + total current value of everything in Investments.
- **Rebalance flag** — any allocation category more than your configured threshold (percentage points, default 5, wider for the Aggressive preset since more volatility is expected) off your own target gets flagged "over/under target." Purely descriptive (a diff against your own numbers), not a buy/sell recommendation.
- **Discipline-first ordering** — both the chat advisor and the monthly review check flexible/lifestyle budget overspend and emergency-fund status *before* discussing investment allocation, regardless of risk profile. A high-risk profile changes the target allocation and rebalance band, not the order of what gets checked first.

None of this requires AI — it's deterministic math over your transaction history, recalculated on every page load. The monthly review and chat advisor layer an AI-written summary on top of the same numbers, with a rule-based fallback if the AI call fails.

---

## 4. Tech stack — and what's free

Everything below is either open-source (free forever, runs on your own infrastructure) or on a provider's free tier. The only ongoing cost risk is if your usage on a hosted service (database, AI calls, hosting) grows past that provider's free-tier limits — the code itself has no license fees or subscriptions built in.

**Application**
- **Next.js** (App Router) + **React** + **TypeScript** — open-source, free.
- **Tailwind CSS** — open-source, free.
- **Framer Motion** — animations, open-source, free.
- **Recharts** — charts, open-source, free.
- **react-hook-form + zod** — forms & validation, open-source, free.
- **lucide-react** — icons, open-source, free.
- **sonner** — toast notifications, open-source, free.
- **jsPDF** — PDF export, open-source, free.

**Data**
- **PostgreSQL via Neon** — your database. Neon has a generous free tier (enough for a single-user app like this); cost only kicks in if you scale far beyond personal use.
- **Prisma** — ORM/migration tool, open-source, free.

**AI**
- **OpenRouter** — routes chat requests to `google/gemini-2.5-flash` (configurable via `OPENROUTER_MODEL`). OpenRouter has free-tier/low-cost model access; you're using your own API key, so cost tracks directly to your OpenRouter account and usage volume — the app itself doesn't add markup or a subscription layer.

**Market data (free, no API key)**
- **mfapi.in** — live NAV for Indian mutual funds, looked up by AMFI scheme code. No signup, no key, no rate limit.
- **Yahoo Finance's public quote endpoint** — live price for stocks by ticker (e.g. `RELIANCE.NS` for NSE). Unofficial but widely used and stable; no key required.
- Both are best-effort, on-demand only (you click "refresh price" — nothing auto-polls in the background), so there's no cost or quota risk from usage.

**Hosting & automation**
- **Vercel** — deployment target (per `vercel.json`), has a free Hobby tier suitable for a personal project.
- **Vercel Cron** — triggers the monthly review automatically on the 1st of each month (`vercel.json` → `crons`), included free on the Hobby plan. To lock the cron endpoint down to only Vercel's own invocations, set a `CRON_SECRET` environment variable in your Vercel project — without it, the route still only accepts same-origin/dev requests, same as every other API route here.

**Not currently used**: Supabase environment variables exist in your `.env.local` but nothing in the codebase actually calls Supabase — it's unused, so no cost from it either way.

---

## 5. What's deliberately not included

- No brokerage/bank API integration (would require handling your real financial credentials — a decision you'd need to make and set up explicitly, not something added silently).
- No automated trading or fund transfers of any kind.
- No claim of being a SEBI-registered investment adviser — the AI explains concepts and analyzes your own numbers, it doesn't issue personalized buy/sell recommendations.
- No gamified "unlock more risk" mechanics that change your real target allocation automatically — any change to what you're actually invested in only happens when you deliberately edit Settings yourself.

## 5a. A limit worth stating plainly

This app — or any AI, rules engine, or dashboard — cannot guarantee correct financial outcomes. Markets are genuinely unpredictable, the AI can be wrong, and "young + aggressive + high spending" is exactly the profile where a bad multi-year stretch can undo a decade of gains no matter how good the tooling is. Treat Runway as a disciplined tracking and analysis tool that shows you your real numbers clearly and checks cash-flow discipline before growth — not as a replacement for professional judgment on major, high-stakes decisions.

---

## 6. Access control — required before you deploy

The app now sits behind a password gate. **Nobody can see any page or call any API without it** — this was added specifically because a Vercel URL is otherwise public to anyone who has the link, and this app holds your real financial data.

**Required environment variables** (set these in your Vercel project's Settings → Environment Variables before your first deploy — the app deliberately fails closed and blocks all access if either is missing):

- `SITE_PASSWORD` — the password you'll type to get in. Pick your own; nothing in the code sets a default.
- `AUTH_SECRET` — a random secret used to sign the session cookie. Generate one yourself, e.g. run `openssl rand -base64 32` locally and paste the output in. Don't reuse the value from local `.env.local` (that one was auto-generated for my own testing during development and should be treated as burned).

How it works: `/login` checks your password against `SITE_PASSWORD` and sets an `httpOnly`, `Secure` (in production), signed session cookie good for 30 days. `proxy.ts` (Next's request gate, run on every request) checks that cookie before letting any page or API route through, and redirects to `/login` otherwise. There's a "Log out" button in the sidebar. The one exception is the monthly-review cron endpoint, which Vercel calls directly (not through a browser) and which checks its own separate `CRON_SECRET` instead — set that one too (see the Hosting & automation section above) or the monthly review will stay in fallback/dev-only mode.

If you ever suspect the password leaked, just change `SITE_PASSWORD` (and ideally `AUTH_SECRET`, which will also invalidate all existing sessions) in Vercel and redeploy.

---

## 7. Recent fix worth knowing about

The AI advisor's connection to OpenRouter was pointing at a URL that doesn't resolve (`api.openrouter.ai`), so it had been silently falling back to canned, non-AI responses. Fixed to the correct endpoint (`openrouter.ai/api/v1`). Worth a quick real-world check once deployed to confirm live AI replies are coming through in your actual environment (not just the fallback).
