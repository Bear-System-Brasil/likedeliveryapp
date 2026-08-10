import { ErrorBoundary } from "@/components/error-boundary";
import { BottomBar } from "@/components/ui/bottom-bar";
import { AuthProvider } from "@/contexts/auth-provider";
import { Providers } from "@/providers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import type React from "react";
import { Suspense } from "react";
// @ts-ignore: Cannot find module or type declarations for side-effect import of './globals.css'
import "./globals.css";

export const metadata: Metadata = {
  title: "Like Delivery App",
  description: "Sistema completo de delivery",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <AuthProvider>
              <Suspense fallback={null}>{children}</Suspense>
              <BottomBar />
            </AuthProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
