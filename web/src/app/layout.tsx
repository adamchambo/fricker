import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

/** Soft editorial serif with a real bold master (Instrument Serif is single-weight 400 and reads thin at large sizes). */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: "700",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "fricker — the friend picker",
  description: "Pick friends, get ideas, send plans they can accept — fricker is the friend picker for your crew.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${manrope.variable} min-h-screen antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
