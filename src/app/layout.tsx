import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Jam - TikTok CPM Analyzer",
  description: "Professional creator analytics platform for TikTok partnership ROI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}    
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}