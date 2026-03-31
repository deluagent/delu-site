import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "delu — autonomous onchain trader",
  description: "An AI agent that trades onchain using Bankr execution and x402 for real-time intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen relative z-10">{children}</body>
    </html>
  );
}
