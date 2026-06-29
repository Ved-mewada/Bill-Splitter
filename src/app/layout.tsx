import type { Metadata } from "next";
import { Manrope, Space_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "ExpenseHub",
  description: "Track personal expenses and manage shared group expenses seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceMono.variable} ${playfair.variable}`}>
      <body className={`font-manrope text-on-surface antialiased min-h-screen`}>
        <div className="bg-gradient-layer"></div>
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-orb bg-orb-4"></div>
        <div className="bg-map-lines"></div>
        <div className="bg-travel-dust"></div>
        <div className="bg-vignette"></div>
        <div className="bg-noise"></div>
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
