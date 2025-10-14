import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NAPA Copilot",
  description: "Futuristic 3D store + chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
