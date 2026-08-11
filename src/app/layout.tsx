import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/StructuredData";
import { siteConfig } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RepoMind — Understand the code before you change it",
    template: "%s · RepoMind",
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  applicationName: "RepoMind",
  keywords: ["repository analysis", "codebase architecture", "dependency graph", "developer onboarding"],
  openGraph: {
    type: "website",
    siteName: "RepoMind",
    title: "RepoMind — Understand the code before you change it",
    description: siteConfig.description,
    url: siteConfig.url,
    images: [
      {
        url: "/og-hero.svg",
        width: 1200,
        height: 630,
        alt: "RepoMind repository intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoMind — Understand the code before you change it",
    description: siteConfig.description,
    images: ["/og-hero.svg"],
  },
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
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
