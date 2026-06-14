import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { themeScript } from "@/components/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Eleviq Labs — Earn from the content you create",
  description:
    "Eleviq Labs is where creators team up with brands on clipping campaigns: post your clips, grow the views, and get paid for the reach you deliver.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
        <div className="app-backdrop" />
        {children}
      </body>
    </html>
  );
}
