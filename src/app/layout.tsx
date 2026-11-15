import type { Metadata } from "next";
import { Barlow_Condensed, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "@/components/ui/Toast";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MISSIONFORGE // Orbital Mission Simulator",
  description:
    "Design, launch, and operate deep-space missions. High-fidelity orbital mechanics, systems engineering, and payload trade studies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${interTight.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <body className="h-full min-h-screen bg-space-bg text-slate-200 antialiased font-body bg-scanline selection:bg-telemetry-amber/30 selection:text-white flex flex-col">
        <div className="fixed inset-0 pointer-events-none bg-radial-vignette z-0" />
        <main className="relative z-10 flex-1 flex flex-col min-h-0 h-full">
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
