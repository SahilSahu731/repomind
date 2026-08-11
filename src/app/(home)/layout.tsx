import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-theme flex min-h-screen flex-col bg-[#f5f0e5] text-[#292721]">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[#292721] px-5 py-3 text-sm font-medium text-[#f5f0e5] transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
