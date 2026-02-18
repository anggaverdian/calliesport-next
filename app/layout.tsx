import type { Metadata } from "next";
import { DM_Sans, Quantico, Funnel_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import EdgeSwipeBlocker from "./ui_pattern/EdgeSwipeBlocker";

const GlobalFont = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const quantico = Quantico({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-score', // This creates a CSS variable
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // This is the critical part for transparency
  interactiveWidget: 'resizes-visual', // Prevent content shifting when keyboard opens (PWA iOS/Android)
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: "Calliesport Padel",
  description: "Score tracking app for your padel tournaments",
  manifest: "/manifest.json",
  icons: {
    icon: "/calliesport-logo.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Calliesport",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body className={`${GlobalFont.className} antialiased max-w-[393px] min-w-[393px] min-h-screen overflow-x-hidden mx-auto`}>
        <EdgeSwipeBlocker />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
