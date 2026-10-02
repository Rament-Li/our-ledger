import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spending Ledger",
  description: "A private shared spending ledger.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/penguin-cucumber-icon-v2.png",
    shortcut: "/penguin-cucumber-icon-v2.png",
    apple: "/apple-touch-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
