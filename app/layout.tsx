import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/Navigation";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "optional",
  preload: true,
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "optional",
  preload: true,
});

const sora = Sora({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "optional",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "FinPilot — Premium Personal Wealth Manager",
    template: "%s | FinPilot",
  },
  description:
    "Your AI-powered personal finance advisor. Track spending, manage budgets, set goals and receive elite wealth management insights — tailored to the Indian financial ecosystem.",
  keywords: ["personal finance", "wealth management", "budgeting", "INR", "India", "financial advisor", "SIP", "investments", "AI finance"],
  authors: [{ name: "FinPilot" }],
  robots: { index: false, follow: false },
  openGraph: {
    title: "FinPilot — Premium Personal Wealth Manager",
    description: "Your AI-powered personal finance advisor tailored to the Indian financial ecosystem.",
    type: "website",
    locale: "en_IN",
    siteName: "FinPilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinPilot - Premium Personal Wealth Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinPilot — Premium Personal Wealth Manager",
    description: "Your AI-powered personal finance advisor tailored to the Indian financial ecosystem.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#faf9f6" },
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
      className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${sora.variable} h-full`}
    >
      <head>
        <meta name="view-transition" content="same-origin" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-jakarta">
        <main className="flex-1 pb-24">
          {children}
        </main>
        <Navigation />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
