import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { PostHogProvider } from "@/components/PostHogProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Note Rush",
  description: "by abilash suresh @chainsaw_co",
  icons: [{ rel: "icon", url: "/logo_note_rush.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <head>
        <script src="//unpkg.com/react-scan/dist/auto.global.js" async />
      </head>
      <body className="bg-background min-h-screen font-sans antialiased">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="fixed top-4 right-8">
              <ThemeToggle />
            </div>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
