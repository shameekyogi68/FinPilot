import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: {
    default: "FinPilot — Shameek Yogi's Personal Wealth Manager",
    template: "%s | FinPilot",
  },
  description:
    "Shameek Yogi's AI-powered personal finance advisor. Track spending, manage budgets, set goals and receive elite wealth management insights — tailored to the Indian financial ecosystem.",
  keywords: ["personal finance", "wealth management", "budgeting", "INR", "India", "financial advisor", "SIP", "investments", "AI finance"],
  authors: [{ name: "Shameek Yogi" }],
  robots: { index: false, follow: false },
  openGraph: {
    title: "FinPilot — Shameek Yogi's Personal Wealth Manager",
    description: "Shameek Yogi's AI-powered personal finance advisor tailored to the Indian financial ecosystem.",
    type: "website",
    locale: "en_IN",
    siteName: "FinPilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinPilot - Shameek Yogi's Personal Wealth Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinPilot — Shameek Yogi's Personal Wealth Manager",
    description: "Shameek Yogi's AI-powered personal finance advisor tailored to the Indian financial ecosystem.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7FF" },
    { media: "(prefers-color-scheme: dark)",  color: "#F8F7FF" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${inter.variable} h-full`}
    >
      <head>
        <meta name="view-transition" content="same-origin" />
      </head>
      <body
        className="min-h-full antialiased page-bg"
        style={{ color: "#0F0E17" }}
      >
        {/* Desktop: content shifted by sidebar; Mobile: content + bottom nav */}
        <Navigation />
        <main
          className="lg:ml-[240px] pb-20 lg:pb-0"
          style={{ minHeight: "100vh" }}
        >
          <div className="lg:px-10 lg:py-8 px-4 py-6 max-w-[1280px]">
            {children}
          </div>
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
