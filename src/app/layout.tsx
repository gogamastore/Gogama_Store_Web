import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import ResellerHeader from "@/components/reseller-header";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Toko Central",
  description: "Marketplace & POS System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <ResellerHeader />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
