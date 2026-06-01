import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NotificationsShell } from "@/components/notifications/NotificationsShell";
import { normalizeTheme, THEME_COOKIE, THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "LiveCare TI",
  description: "Sistema de chamados de TI da Live Academia",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const pref = normalizeTheme(c.get(THEME_COOKIE)?.value);
  // Light/dark explicito - classe ja vai certa.
  // System: o script inline resolve antes do React rodar.
  const initialClass = pref === "dark" ? "dark" : "";

  return (
    <html lang="pt-BR" className={initialClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <NotificationsShell />
      </body>
    </html>
  );
}
