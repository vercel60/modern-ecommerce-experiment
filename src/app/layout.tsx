import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Akaar — Virtual fitting room",
  description: "Try on outerwear, bottoms, shoes and accessories in an interactive fitting room.",
};

export const viewport: Viewport = { themeColor: "#c3c8cc", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
