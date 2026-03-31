import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/src/styles/index.css";
import Providers from "@/src/components/theme/Providers";
import { Navigation } from "@/src/components/layout";
import { Toaster } from "@/src/components/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure File Sharing with Expiring Encrypted Links | VanishVault",
  description:
    "Securely share encrypted files or credentials with expiring links, password protection, view limits, and instant browser print access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          <Toaster position="top-center" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
