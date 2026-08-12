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
// allergen) on a dark rounded square. Real files under public/ (favicon.ico
// /.svg, apple-touch-icon.png) rendered from this same design, replacing the
// old data-URI-only favicon. basePath isn't auto-applied to metadata.icons
// string paths (only to <Link>/<Image>/router navigation), so it's prefixed
// explicitly here, matching next.config.ts's own basePath logic exactly.
const BASE_PATH = process.env.E2E_NO_BASE_PATH ? "" : "/allergy-locator";

export const metadata: Metadata = {
  title: "Allergy Locator",
  description:
    "Pick your allergens, see where in the US is best or worst for you. Directional, not medical advice.",
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon.ico`, sizes: "any" },
      { url: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml" },
    ],
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
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
