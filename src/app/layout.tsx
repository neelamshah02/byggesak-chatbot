import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Byggesak Chatbot - Stavanger & Sandnes",
  description:
    "Forstå byggeforskrifter og krav på en enkel måte. Få hjelp med byggesaker i Stavanger og Sandnes kommune.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
