import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT DPSA Asset & Inventory Management",
  description: "Dashboard Ringkasan dan Manajemen Aset & Inventaris PT DPSA",
  icons: {
    icon: "/logo-dpsa.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased min-h-screen bg-[#f3f6fa] text-slate-800">
        {children}
      </body>
    </html>
  );
}
