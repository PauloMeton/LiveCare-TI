import "./globals.css";
import type { Metadata } from "next";
import { NotificationsShell } from "@/components/notifications/NotificationsShell";

export const metadata: Metadata = {
  title: "LiveCare TI — Suporte interno",
  description: "Sistema de chamados de TI da Live Academia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        {/* Toasts in-app */}
        <NotificationsShell />
      </body>
    </html>
  );
}
