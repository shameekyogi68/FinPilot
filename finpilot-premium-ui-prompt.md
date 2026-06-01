# FinPilot — World-Class Premium UI Redesign Prompt
# Paste this into Cursor, v0, Lovable, or Bolt
# DO NOT touch any business logic, API calls, or state management
# ONLY redesign CSS, JSX structure, layout, typography, spacing, and colors

---

## ROLE & GOAL

You are a Senior Product Designer at a world-class fintech studio (think Stripe, Linear, Revolut, Wise).
You are redesigning FinPilot — a personal finance web app for India (INR ₹ currency).
The app already works perfectly. Your ONLY job is to make it look like it was designed by a world-class team.
The kind of UI that wins Awwwards, gets featured on Dribbble, and feels as premium as Stripe's dashboard.

DESIGN PHILOSOPHY:
Think "Bloomberg Terminal meets Stripe Dashboard meets Linear" —
calm, dense with information, deeply trustworthy, zero decorative noise.
Every pixel should communicate financial confidence and precision.
This is NOT a consumer banking app with playful illustrations.
This is a serious wealth management tool that happens to be beautiful.

---

## TECH STACK (already in use — extend, don't replace)

- React + TypeScript
- Tailwind CSS (extend tailwind.config.ts for custom tokens)
- shadcn/ui components (retheme, don't rebuild)
- Recharts for all charts
- Lucide React for icons (strokeWidth: 1.5 everywhere)
- Framer Motion (add if not present — for transitions only)

---

## GLOBAL RULES — apply to every single file you touch

1. Import Inter from Google Fonts with variable axes: wght 100..700, opsz 14..32
   Add to globals.css: font-feature-settings: 'cv01','ss01','ss03';
   For all monetary values: font-variant-numeric: tabular-nums;

2. Remove ALL default Tailwind blue. Brand color is violet-600 (#7C3AED).

3. Page background: #F8F7FF (light mode) / #0A0A0F (dark mode) — never pure white or pure black.

4. Every shadow — use only these two:
   --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06);
   --shadow-elevated: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06);

5. Border radius tokens:
   --r-sm: 6px  --r-md: 10px  --r-lg: 14px  --r-xl: 20px  --r-pill: 999px

6. All transitions: 160ms cubic-bezier(0.25, 0.46, 0.45, 0.94)

7. Lucide icons: always strokeWidth={1.5}, size={16} inline, size={18} in nav, size={20} in headers

8. NO colored icon circles/bubbles anywhere. Replace with small monochrome icons.

9. NO serif fonts. Inter only.

10. NO generic blue (#3B82F6). Violet (#7C3AED) is the ONLY brand accent.

---

## DESIGN SYSTEM TOKENS — add to tailwind.config.ts

```ts
theme: {
  extend: {
    colors: {
      brand: {
        50:  '#F5F3FF',
        100: '#EDE9FE',
        200: '#DDD6FE',
        300: '#C4B5FD',
        400: '#A78BFA',
        500: '#8B5CF6',
        600: '#7C3AED', // primary — use this most
        700: '#6D28D9',
        800: '#5B21B6',
        900: '#4C1D95',
      },
      surface: {
        DEFAULT: '#FFFFFF',
        subtle:  '#F8F7FF',
        raised:  '#FFFFFF',
        overlay: 'rgba(248,247,255,0.85)',
      },
      gain:  { DEFAULT:'#059669', subtle:'#ECFDF5', text:'#065F46' },
      loss:  { DEFAULT:'#DC2626', subtle:'#FEF2F2', text:'#991B1B' },
      warn:  { DEFAULT:'#D97706', subtle:'#FFFBEB', text:'#92400E' },
      ink: {
        primary:   '#0F0E17',
        secondary: '#4B4963',
        tertiary:  '#8B89A0',
        disabled:  '#C4C2D4',
      },
      edge: {
        subtle: 'rgba(0,0,0,0.06)',
        base:   'rgba(0,0,0,0.10)',
        strong: 'rgba(0,0,0,0.18)',
      },
    },
    fontFamily: {
      sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      'display-lg': ['2.75rem', { lineHeight:'1.1',  letterSpacing:'-0.04em',  fontWeight:'600' }],
      'display-md': ['2rem',    { lineHeight:'1.15', letterSpacing:'-0.03em',  fontWeight:'600' }],
      'display-sm': ['1.375rem',{ lineHeight:'1.2',  letterSpacing:'-0.025em', fontWeight:'550' }],
      'label-xs':   ['0.6875rem',{ lineHeight:'1.4', letterSpacing:'0.07em',  fontWeight:'500', textTransform:'uppercase' }],
    },
    boxShadow: {
      card:     '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)',
      elevated: '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
      focus:    '0 0 0 3px rgba(124,58,237,0.18)',
    },
    borderRadius: {
      sm: '6px', md: '10px', lg: '14px', xl: '20px', pill: '999px',
    },
    transitionTimingFunction: {
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
},
```

---

## LAYOUT SHELL (applies to all pages)

Remove the bottom tab bar on desktop (≥1024px).
Replace with a fixed left sidebar: width 220px, background #FFFFFF, right border 1px solid edge-subtle.

Sidebar structure:
- Top 56px: Logo left-aligned, 18px font-weight 600, violet-600. No icon.
- Nav items: 40px height, 12px horizontal padding, 8px gap, icon(18px) + label(14px).
  Active: bg brand-50, text brand-600, icon brand-600, left border 2px solid brand-600.
  Inactive: text ink-secondary, hover bg surface-subtle.
- Bottom pinned: Settings item + user avatar (32px circle, initials, bg brand-100 text brand-700).

Main content: margin-left 220px, padding 32px 40px, max-width 1280px.
Mobile (< 1024px): sidebar becomes bottom bar, 60px height, 6 items, icon only — no labels.

---

## DASHBOARD PAGE

REMOVE: The big blue gradient hero banner entirely.
REPLACE WITH: A simple top bar — 2 lines.
  Line 1: "Good morning, [name]" — 22px, font-weight 500, ink-primary.
  Line 2: "June 2026 · ₹X,XX,XXX net worth" — 14px, ink-tertiary, tabular-nums.
  Right side: Refresh icon button (ghost) + date chip.

STAT CARDS (4 cards — Monthly Income / Expenses / Net Balance / Savings Rate):
  Layout: CSS grid, 4 columns desktop, 2 tablet, 1 mobile. gap-4.
  Each card: bg white, shadow-card, border-radius-lg, padding 20px 24px.
  Structure per card:
    Row 1: [Icon 16px ink-tertiary] [Label text-label-xs ink-tertiary] [flex-1] [trend badge]
    Row 2: [Amount text-display-sm tabular-nums] in ink-primary
    Row 3: [Subtitle 12px ink-tertiary]
  Trend badge: pill, 10px font. Positive = gain-subtle bg + gain-text. Negative = loss-subtle + loss-text.
  Left border accent 3px: income=gain, expense=loss, net=brand-600, savings=warn.
  NO colored circles. NO gradient backgrounds on cards.
  Hover: transform translateY(-1px), shadow-elevated, transition 160ms smooth.

AI INSIGHTS SECTION:
  Card: bg white, shadow-card, border-radius-lg, padding 24px.
  Header: "AI Insights" 16px font-weight 500 + sparkles icon brand-600
    + confidence pill (brand-50 bg, brand-700 text) + Refresh button ghost right-aligned.
  Each insight in its own mini-card (border-radius-md, padding 14px 16px):
    POSITIVE: bg gain-subtle, left-border 3px gain-DEFAULT, icon CheckCircle gain-DEFAULT.
    WARNING:  bg warn-subtle,  left-border 3px warn-DEFAULT, icon AlertTriangle warn-DEFAULT.
    TIP:      bg brand-50,     left-border 3px brand-300,    icon Lightbulb brand-600.
  Text: 14px ink-primary, line-height 1.6.
  Action buttons (View Details / Adjust Budget): 12px, outline ghost, colored per type, right-aligned.

EXPENSES BY CATEGORY + RECENT TRANSACTIONS:
  Side-by-side grid: 40% / 60% split desktop, stacked mobile.
  Both: bg white, shadow-card, border-radius-lg.
  Section headers: 15px font-weight 500, icon 16px ink-secondary, border-bottom edge-subtle.
  Empty states: 64px abstract SVG geometric illustration, centered.
    "No data yet" 14px ink-secondary, CTA link brand-600 underline — no big generic icon.

---

## TRANSACTIONS PAGE

HEADER: "Add Transaction" title + History button top-right. No gradient.

EXPENSE/INCOME TOGGLE:
  Pill-shaped container bg surface-subtle, border edge-subtle, full width, height 40px.
  Active side: bg white, shadow-card, text ink-primary.
  Inactive: text ink-tertiary.
  Sliding animation via transform, 160ms spring.

FORM FIELDS:
  Label: 12px font-weight 500 ink-secondary, margin-bottom 6px, display block.
  Input: height 44px, border 1px edge-base, border-radius-md, padding 0 14px,
    font-size 15px ink-primary. Focus: border brand-600, shadow-focus, outline none.
  Amount field: 52px height, font-size 24px tabular-nums font-weight 500,
    ₹ prefix in 48px left-section, bg surface-subtle, border-right edge-subtle, ink-secondary.
  Category: custom Combobox (shadcn), with colored dot indicator per category.
  Submit button: 100% width, 48px height, bg brand-600, text white, border-radius-md,
    font-weight 500, font-size 15px. Hover: brand-700. Active: scale(0.99). Loading: spinner.

TRANSACTIONS LIST:
  Search bar: 100% width, 40px height, left Search icon 16px ink-tertiary.
  Each transaction row: flex, 56px min-height, border-bottom edge-subtle.
    Left: category dot 8px + icon 16px, 40px fixed width.
    Center: merchant name 14px ink-primary font-weight 500 / note 13px ink-tertiary.
    Right: amount — income +₹X,XXX gain-DEFAULT / expense -₹X,XXX loss-DEFAULT, tabular-nums.
    Hover: bg surface-subtle.
  Group by date: sticky date headers, 11px uppercase ink-tertiary, letter-spacing 0.07em.

---

## BUDGETS PAGE

HEADER: "Budget Management" + "+ Add Budget" — outline ghost, brand-600 text+border.

SUMMARY STRIP: 3 inline cards — Actual Income / Total Budgeted / Available.
  Each: bg white, shadow-card, border-radius-lg, label-xs + display-sm amount. 1/3 width each.

BUDGET LIST ITEMS (each budget):
  Card, padding 20px 24px.
  Row 1: category icon 16px + name 15px font-weight 500 + flex-1 + spent/limit badge.
  Row 2: Progress bar — height 6px, border-radius-pill, bg edge-subtle.
    Fill: brand-600 if <75%, warn if 75-99%, loss if ≥100%.
    Animate on mount: width 0 → actual%, 600ms ease-out.
  Row 3: "₹X,XXX spent of ₹X,XXX" — 12px ink-tertiary tabular-nums.

---

## GOALS PAGE

HEADER: "Financial Goals" + "+ New Goal" button.

GOAL CARDS (2-column grid, staggered):
  Card: bg white, shadow-card, border-radius-xl, padding 24px.
  Top: goal icon in brand-100 square 40px border-radius-md + goal name 16px font-weight 500.
  Target amount: text-display-sm tabular-nums brand-600.
  Circular progress ring: 64px SVG circle, stroke brand-600, track edge-subtle, stroke-width 5.
  Deadline + days remaining chip.
  "Add Funds" button: full width, outline brand-600.

---

## ANALYTICS PAGE

HEADER: "Spending Analytics" + custom-styled month/year selectors (NOT browser native select).

MONTHLY SUMMARY: 2×2 grid metric cards, same style as dashboard stat cards.

6-MONTH CHART (Recharts AreaChart):
  No CartesianGrid. Only 3 horizontal reference lines at key ₹ amounts.
  Area fill: linearGradient, brand-600, opacity 0.15 top → 0.01 bottom.
  Expense line: loss-DEFAULT dashed, strokeDasharray="4 2".
  Custom tooltip: white card, shadow-elevated, border-radius-md, 14px tabular-nums.
  Axes: 12px ink-tertiary, no axis lines, tick labels only.
  Dots: r={3} fill="white" stroke brand-600 strokeWidth={2}.

YEARLY TREND (Recharts BarChart):
  Bars: borderRadius [6,6,0,0].
  Current month: brand-600. Past months: brand-200. Future months: edge-subtle.
  No grid lines. Y-axis right side only.

CATEGORY BREAKDOWN: Horizontal bars.
  Each row: category label + bar (8px height, border-radius-pill) + amount right-aligned.
  Colors: brand-600, #059669, #D97706, #06B6D4, #EC4899 — one per category.

DAILY HEATMAP: 7-column grid.
  Each cell: 28px square, border-radius-sm.
  Color scale 5 stops: edge-subtle (₹0) → brand-700 (max spend day).
  Hover: tooltip with exact amount + date.

---

## AI CHAT PAGE

Layout: full-height flex column. Only message area scrolls.

HEADER CARD: bg white, shadow-card, border-radius-lg, padding 16px 20px.
  Left: 40px circular avatar, gradient brand-600→brand-400, "FP" white initials.
  Center: "FinPilot AI" 15px font-weight 500 / "Personal Wealth Advisor" 12px ink-tertiary.
  Status: animated pulse dot 8px gain + "Online" 12px gain-text + "Free forever" pill brand-50/brand-700.
  Right: Clear button ghost, Trash2 icon only 16px.

AI MESSAGES:
  Max-width 80%. Bubble: bg white, shadow-card, border-radius-lg (12px, bottom-left 4px).
  Avatar 28px shown only on FIRST consecutive AI message. Hidden for following.
  Text: 14px ink-primary, line-height 1.65.

USER MESSAGES:
  Align right. Bubble: bg brand-600, text white, border-radius-lg (12px, bottom-right 4px).
  No avatar.

Typing indicator: 3 dots brand-600, staggered scale animation 400ms loop.

QUICK REPLY CHIPS: horizontal scroll, no scrollbar visible.
  Each: bg white, border edge-base, border-radius-pill, 13px ink-primary, padding 8px 14px.
  Hover: bg brand-50, border brand-300, text brand-700.

INPUT BAR: bg white, shadow-elevated, border-radius-xl, padding 12px 16px.
  Textarea auto-grow 1–4 lines. Font 14px ink-primary.
  Send button: 36px circle, bg brand-600, Send icon 16px white. Disabled: bg edge-subtle icon ink-disabled.

---

## SETTINGS PAGE

Layout: single column, max-width 680px, centered.
Header: "Account preferences" 22px font-weight 500 + "Save all" button brand-600 filled top-right.

Each section its own card (bg white, shadow-card, border-radius-lg):
  Section header: icon 18px brand-600 + title 15px font-weight 500 + subtitle 13px ink-tertiary.
  Divider: 1px edge-subtle.
  Fields: full-width, label above input, 20px vertical gap between fields.

Toggle (AI Insights):
  52px × 28px. Track: bg edge-subtle (off) / brand-600 (on).
  Thumb: white circle 22px shadow-card. Transition: 200ms smooth. border-radius-pill.

Danger Zone card:
  Border: 1px solid rgba(220,38,38,0.2). Background: rgba(254,242,242,0.5).
  Title: loss-text font-weight 500.
  Export + Backup: outline buttons, ink-secondary.
  Delete All Data: bg loss-DEFAULT text white. Always show confirmation dialog before executing.

---

## MOTION SYSTEM

```ts
// 1. Page transitions — wrap each page root
const pageVariants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25,0.46,0.45,0.94] } },
  exit:     { opacity: 0, y: -4, transition: { duration: 0.16 } },
}

// 2. Card stagger — for lists
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
}
const cardVariants = {
  initial:  { opacity: 0, y: 12, scale: 0.99 },
  animate:  { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: [0.25,0.46,0.45,0.94] } },
}

// 3. Number count-up animation for ₹ amounts
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])
  return value
}

// 4. Budget bar animate on mount
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${pct}%` }}
  transition={{ duration: 0.7, ease: [0.25,0.46,0.45,0.94], delay: 0.1 }}
/>

// 5. Sidebar active indicator — slides between items
<motion.div layoutId="nav-active" className="absolute inset-0 bg-brand-50 rounded-md" />

// 6. Toast on transaction add (sonner)
toast.success('Transaction added', {
  description: `-₹${amount} · ${category}`,
  style: { background:'#fff', border:'1px solid rgba(0,0,0,0.08)',
    boxShadow:'0 4px 16px rgba(0,0,0,0.08)', borderRadius:'10px' }
})
```

---

## HARD RULES — NEVER VIOLATE

NEVER:
✗ Gradient backgrounds on page or section level — the hero banner is gone permanently
✗ Colored icon bubbles or circles around icons anywhere in the app
✗ border-radius > 20px on rectangular cards
✗ font-weight 700 or above anywhere
✗ box-shadow with color tint — always rgba(0,0,0,x) only
✗ Tailwind blue-500/600 anywhere — violet only
✗ Bottom nav bar on desktop — it must be a left sidebar
✗ Serif fonts anywhere
✗ More than 3 font sizes in a single card component
✗ CSS animation duration > 700ms
✗ Placeholder text as the only label — always a visible label above every input

ALWAYS:
✓ tabular-nums on every monetary value — prevents layout shift
✓ INR formatting: toLocaleString('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:0})
✓ Loading skeleton matching exact shape of content (not a generic spinner)
✓ focus-visible ring: ring-2 ring-brand-600 ring-offset-2 on every interactive element
✓ aria-label on every icon-only button
✓ Border on every white card: 1px edge-subtle — white on white needs separation
✓ Test every screen in dark mode

RECHARTS RULES:
✓ Remove CartesianGrid or stroke="rgba(0,0,0,0.04)"
✓ Custom Tooltip component always — never default Recharts tooltip
✓ Axes: tick fontSize={12} fill="#8B89A0" axisLine={false} tickLine={false}
✓ Y-axis values: tickFormatter={v => '₹'+v.toLocaleString('en-IN')}
✓ Area gradient: define in <defs> with linearGradient, use url(#id) as fill

SHADCN OVERRIDES (globals.css):
- Button primary: bg brand-600, hover:brand-700, active:brand-800
- Input/Select: border edge-base, focus:border-brand-600 + shadow-focus
- Card: shadow-card, border edge-subtle, border-radius-lg
- Dialog: border-radius-xl, shadow-elevated, backdrop blur-sm bg-black/30
- Switch: track brand-600 on, thumb white shadow-card

---

## FILE ORDER TO EDIT

1. tailwind.config.ts — add all tokens
2. globals.css — Inter import, base resets, shadcn variable overrides
3. components/layout/Sidebar.tsx — new left sidebar, remove bottom nav
4. app/dashboard/page.tsx — remove hero, new stat cards + AI insights
5. app/transactions/page.tsx — new form + transaction list
6. app/budgets/page.tsx — budget cards with animated progress bars
7. app/goals/page.tsx — goal cards with ring progress
8. app/analytics/page.tsx — all chart restyling
9. app/ai/page.tsx — premium chat UI
10. app/settings/page.tsx — clean settings layout
