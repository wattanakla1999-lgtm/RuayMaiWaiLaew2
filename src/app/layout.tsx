import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "รวยไม่ไว้แล้ว — ค้นหาปั๊มน้ำมันใกล้ฉัน",
  description: "ค้นหาปั๊มน้ำมันที่มีน้ำมันในสถานการณ์ขาดแคลน อัปเดตแบบ real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${geist.variable} h-full`}>
      <body className="min-h-full antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
