import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Hostel Management",
  description: "Managed by advanced systems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Toaster />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
