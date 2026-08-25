import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI QA Expert - Intelligent Test Engineering Assistant",
  description: "From Requirement to Test Automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}