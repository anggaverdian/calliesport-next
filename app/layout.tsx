import type { Metadata } from "next";
import { DM_Sans, Quantico } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const GlobalFont = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const quantico = Quantico({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-score', // This creates a CSS variable
});

export const metadata: Metadata = {
  title: "Calliesport Padel",
  description: "Score tracking app for your game",
  icons: { icon: "/calliesport-logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="flex justify-center">
      <body className={`${GlobalFont.className} antialiased max-w-[393px] min-w-[393px] min-h-screen overflow-x-hidden`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
