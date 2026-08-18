import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallBanner from "@/components/InstallBanner";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "Equity Dashboard",
  description: "Real estate equity tracker",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Equity",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f3d2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        {children}
        <InstallBanner />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
