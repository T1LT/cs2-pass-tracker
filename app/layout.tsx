import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS2 Pass Tracker",
  description: "Track your CS2 battle passes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased overflow-hidden h-screen`}
      >
        <Providers>
          <Navbar />
          <main className="h-[calc(100vh-3.5rem)] overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
