import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const GlobalFont = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
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
    <html lang="en">
      <body className={`${GlobalFont.className} antialiased max-w-[393px] mx-auto min-h-screen overflow-x-hidden`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
