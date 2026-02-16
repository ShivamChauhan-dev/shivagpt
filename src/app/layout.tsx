import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shivagpt",
  description: "Next.js App Router chatbot with Gemini and MongoDB",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
