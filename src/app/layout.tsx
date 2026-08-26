import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Si Cehat | Petualangan Sehat Anak",
  description: "Dunia petualangan sehat bersama avatar AI untuk anak dan keluarga.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
