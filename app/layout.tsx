import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ClerkProvider } from '@clerk/nextjs';
import SessionTracker from '@/components/SessionTracker';

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
        }
      }}
    >
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
          <SessionTracker />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <script 
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  function hideClerkDevNotices() {
                    const selectors = ['.cl-devModeWarning', '.cl-internal-b3fm6y', '[data-clerk-dev-notice]', '.clerk-tooltip'];
                    selectors.forEach(selector => {
                      document.querySelectorAll(selector).forEach(el => el.style.display = 'none');
                    });
                  }
                  hideClerkDevNotices();
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', hideClerkDevNotices);
                  }
                  const observer = new MutationObserver(() => hideClerkDevNotices());
                  observer.observe(document.body, { childList: true, subtree: true });
                })();
              `
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
