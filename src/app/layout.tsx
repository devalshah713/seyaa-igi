import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seyaa Solitaire — B2B Trade Portal",
  description: "Trade desk for IGI-certified lab-grown diamonds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
