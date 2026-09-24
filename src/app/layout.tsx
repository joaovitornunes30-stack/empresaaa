import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aivy — Gestão Financeira",
  description: "Gestão financeira para clínicas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
