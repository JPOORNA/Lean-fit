import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import MUIProvider from "@/components/MUIProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leanfit — ISSA Certified Nutritionist & Fitness Coach",
  description: "Premium health, nutrition, and fitness management portal from Leanfit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${plexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://c1-api.tanvish.co.in" />
      </head>
      <body style={{ margin: 0 }}>
        <ThemeProvider>
          <MUIProvider>
            <AuthProvider>{children}</AuthProvider>
          </MUIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
