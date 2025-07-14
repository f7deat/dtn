import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import Footer from "./components/footer";
import Header from "./components/header";

const quickSand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Đoàn Thanh niên Đại học Hải Phòng",
  description: "Cổng thông tin Đoàn Thanh niên trường Đại học Hải Phòng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${quickSand.className} font-medium`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
