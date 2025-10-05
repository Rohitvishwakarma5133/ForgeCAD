import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ClerkProvider } from '@clerk/nextjs';
import SessionTracker from '@/components/SessionTracker';
import HideClerkDevNotices from '@/components/HideClerkDevNotices';
import LoadingOptimizer from '@/components/LoadingOptimizer';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CADly - Transform Legacy Drawings into Digital Intelligence",
  description: "AI-powered platform that converts engineering drawings and datasheets into structured CAD files in minutes, not hours. 95% faster, 96% cost reduction, 91.5% accuracy.",
  keywords: "CAD conversion, engineering drawings, AI, digital transformation, P&ID, CAD files",
  authors: [{ name: "CADly Team" }],
  openGraph: {
    title: "CADly - Transform Legacy Drawings into Digital Intelligence",
    description: "AI-powered platform that converts engineering drawings and datasheets into structured CAD files in minutes, not hours.",
    url: "https://cadly.ai",
    siteName: "CADly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          // Hide development mode warnings
          developerNotice: 'hidden'
        },
        // Optimize loading performance
        layout: {
          unsafe_disableDevelopmentModeWarnings: true
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          <LoadingOptimizer />
          <SessionTracker />
          <HideClerkDevNotices />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
