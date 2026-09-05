import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import type React from "react";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export const metadata: Metadata = {
  title: "Gym Crew",
  description: "Track gym attendance with your crew.",
  applicationName: "Gym Crew",
  appleWebApp: {
    capable: true,
    title: "Gym Crew",
    statusBarStyle: "black-translucent"
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0B0F14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <ToastProvider>
            {children}
            <InstallPrompt />
            <ServiceWorkerRegistration />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}


