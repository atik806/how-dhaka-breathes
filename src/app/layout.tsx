import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "How Dhaka Breathes",
  description:
    "A data story: Dhaka's air quality, traffic and temperature, hour by hour, across a day and the seasons.",
};

export const viewport: Viewport = {
  themeColor: "#0c0e12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} antialiased`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <div className="haze" aria-hidden />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}
