import "./globals.css";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NotificationsShell } from "@/components/notifications/NotificationsShell";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { normalizeTheme, THEME_COOKIE, THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "LiveCare TI",
  description: "Sistema de chamados de TI da Live Academia",
  applicationName: "LiveCare TI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LiveCare",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffcc00" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Limita o zoom out (mantem zoom in pra acessibilidade)
  minimumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const pref = normalizeTheme(c.get(THEME_COOKIE)?.value);
  const initialClass = pref === "dark" ? "dark" : "";

  return (
    <html lang="pt-BR" className={initialClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <NotificationsShell />
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
