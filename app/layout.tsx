import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: {
    default: "Yogi's Wealth AI — Shameek Yogi's Autonomous Wealth Manager",
    template: "%s · Yogi's Wealth AI",
  },
  description:
    "Shameek Yogi's Autonomous Personal AI Wealth Manager. Real-time Indian Mutual Funds NAV intelligence, daily spending velocity control, multi-model AI consensus, and 4-step monthly wealth wizard.",
  keywords: ["Yogi's Wealth AI", "Shameek Yogi", "wealth manager", "AI advisor", "mutual funds", "SIP tracker"],
  authors: [{ name: "Shameek Yogi" }],
  openGraph: {
    title: "Yogi's Wealth AI — Shameek Yogi's Autonomous Wealth Manager",
    description: "Autonomous Personal AI Wealth Manager & Private Wealth Intelligence Platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yogi's Wealth AI",
    description: "Autonomous Personal AI Wealth Manager & Private Wealth Intelligence Platform.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-full antialiased page-bg">
        <Navigation />
        <main
          className="lg:pl-[244px] pb-[88px] lg:pb-10"
          style={{ minHeight: "100vh" }}
        >
          <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-10 max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
