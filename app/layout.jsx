import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { LanguageModal } from "@/components/layout/LanguageModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Offlix Manager - Multi-Branch Business Management System",
    template: "%s | Offlix Manager"
  },
  description: "Manage branches, employees, products, sales, offline operations, payments, and financial reports from one connected platform.",
  keywords: [
    // Core Brand & Misspellings / Typos
    "Offlix",
    "Offlix Manager",
    "offlixmanager",
    "oflix",
    "oflix manager",
    "oflix manger",
    "offlix manger",
    "offlix erp",
    "offlix pos",
    "business manager",
    "business management",
    "business management software",
    "business management system",
    "business management app",
    "business management platform",
    "business management tool",
    "business management tools",
    "business management software",

    // High-Intent Regional Phrases (Ethiopia Focus)
    "best business management system in ethiopia",
    "best business management software ethiopia",
    "best pos system in ethiopia",
    "ethiopian business software",
    "ethiopia inventory management software",
    "amharic business software",
    "amharic pos system",
    "habesha business software",

    // Intent & Feature Keywords
    "best money manager app",
    "best money management software",
    "best inventory management system",
    "best sales tracking software",
    "best multi branch management app",
    "payment verification system",
    "offline pos mobile app",
    "offline erp software",
    "multi branch business management",
    "retail inventory tracker",
    "business expense and income tracker"
  ],
  authors: [{ name: "Offlix Team" }],
  creator: "Offlix",
  publisher: "Offlix",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://manager.offlix.app",
    title: "Offlix Manager - Multi-Branch Business Management System",
    description: "Manage branches, employees, products, sales, offline operations, and financial reports from one connected platform.",
    siteName: "Offlix Manager",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Offlix Manager Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offlix Manager - Multi-Branch Business Management System",
    description: "Manage branches, employees, products, sales, offline operations, and financial reports from one connected platform.",
    images: ["/images/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-(--background) text-(--foreground)">
        <NextIntlClientProvider>
          {children}
          <LanguageModal />
        </NextIntlClientProvider>

        <Toaster
          position="bottom-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}