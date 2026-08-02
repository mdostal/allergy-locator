import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Leaf mark in this app's own real grass-severity green (hsl(142 68% 45%),
// see lib/severity/palette.ts's GRASS_HUE -- the one validated, headline
// allergen) on a dark rounded square, matching the data-URI favicon pattern
// already shipped for tools.mdostal.com (no binary .ico generation needed).
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%230a0a0a'/%3E%3Cpath d='M50 14C80 30 80 70 50 86C20 70 20 30 50 14Z' fill='%2325c15e'/%3E%3Cpath d='M50 18 L50 82' stroke='%230a0a0a' stroke-width='4'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "Allergy Locator",
  description:
    "Pick your allergens, see where in the US is best or worst for you. Directional, not medical advice.",
  icons: { icon: FAVICON },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <DisclaimerFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
