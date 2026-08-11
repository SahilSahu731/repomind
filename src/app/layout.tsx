import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RepoMind",
  description:
    "AI-powered repository analysis with architecture maps and onboarding guides.",
};

export const openGraph = {
  title: 'RepoMind — Repo architecture intelligence',
  description: 'Turn a repository URL into an architecture map, onboarding route, and risk surface analysis.',
  url: 'https://repomind.example',
  images: [
    {
      url: '/og-hero.svg',
      width: 1200,
      height: 630,
      alt: 'RepoMind Open Graph',
    },
  ],
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
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
