import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "smart-weather",
  description: "ระบบตรวจวัดสภาพอากาศ Smart Weather Station",
  icons: {
    icon: "/ChatGPT Image Jul 20, 2026, 07_50_34 AM.png",
    shortcut: "/ChatGPT Image Jul 20, 2026, 07_50_34 AM.png",
    apple: "/ChatGPT Image Jul 20, 2026, 07_50_34 AM.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
