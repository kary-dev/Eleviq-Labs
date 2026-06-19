import type { Metadata } from "next";
// Secondary font (headings): Open Sauce Sans. Main font (body): Helvetica (system).
import "@fontsource/open-sauce-sans/400.css";
import "@fontsource/open-sauce-sans/500.css";
import "@fontsource/open-sauce-sans/600.css";
import "@fontsource/open-sauce-sans/700.css";
import "./globals.css";
import { themeScript } from "@/components/theme";

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
      <body className="font-sans antialiased">
        <div className="app-backdrop" />
        {children}
      </body>
    </html>
  );
}
