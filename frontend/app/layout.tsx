import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "./globals.css";
import { ToastContainer } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/ui/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Investo — Smart Investment Management",
  description:
    "Investo is a secure, transparent investment management platform. Deposit, track, and grow your wealth with full visibility.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico",       sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Investo — Smart Investment Management",
    description: "Secure, transparent investment management. Deposit, track, and grow your wealth.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Investo" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investo — Smart Investment Management",
    description: "Secure, transparent investment management.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <ToastContainer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
