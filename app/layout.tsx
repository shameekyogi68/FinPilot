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
    default: "Runway — Your Personal Wealth Manager",
    template: "%s · Runway",
  },
  description:
    "A personal wealth manager built for floating income. Track cash flow, know your runway, and budget around what actually comes in — not a fixed monthly number.",
  keywords: ["personal finance", "wealth", "budgeting", "irregular income", "freelance finance", "dashboard"],
  authors: [{ name: "Runway" }],
  openGraph: {
    title: "Runway — Your Personal Wealth Manager",
    description: "A personal wealth manager built for floating income.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runway",
    description: "A personal wealth manager built for floating income.",
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
