import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { clerkAppearance } from "@/lib/clerkTheme";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: {
    template: "%s | RecallIQ",
    default: "RecallIQ — Science-Backed JEE Memorization",
  },
  description:
    "Master JEE with spaced repetition, retrieval practice, interleaving, and calibration. All 6 Make It Stick techniques, built for serious students.",
  keywords: ["JEE", "spaced repetition", "FSRS", "flashcards", "NEET", "study platform"],
  metadataBase: new URL("https://recalliq.app"),
  openGraph: {
    title: "RecallIQ — Science-Backed JEE Memorization",
    description: "Master JEE with all 6 Make It Stick techniques",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1117",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
