import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BonifyProvider } from "@/lib/store/BonifyProvider";
import { RegisterSW } from "@/components/RegisterSW";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ErrorBanner } from "@/components/ErrorBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Bonify – your grocery stats", template: "%s – Bonify" },
  description: "Explore your grocery shopping from digital receipts. Everything is calculated in your browser.",
  // home-screen app on iOS: no Safari bars, content runs under the status bar
  appleWebApp: { capable: true, title: "Bonify", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#0d0c0a" };

// Applies the saved theme before first paint so there is no flash of the wrong design.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('bonify.settings')||'{}');if(s.theme==='clean')document.documentElement.dataset.theme='clean'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme="classic" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <RegisterSW />
        <BonifyProvider>
          <Nav />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 outline-none sm:pb-24">
            {children}
            <Footer />
          </main>
          <ErrorBanner />
        </BonifyProvider>
      </body>
    </html>
  );
}
