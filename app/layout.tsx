import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { SiteHeader } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Bänkli",
  description: "Find and rate benches around you",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}


