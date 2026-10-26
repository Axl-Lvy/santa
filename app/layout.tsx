import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
});
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Père Noël secret",
  description: "Le Père Noël secret de la famille",
  appleWebApp: { capable: true, title: "Père Noël", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1f3b2d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${nunito.variable}`}>
      <body>
        <div className="app-column">{children}</div>
      </body>
    </html>
  );
}
