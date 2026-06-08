"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Banner discreto que informa o usuario quando perde / recupera conexao.
 * - Offline: barra amarela no topo "Você está offline".
 * - Reconectou: barra verde "Reconectado" por 2 segundos + router.refresh() pra
 *   forcar Server Components a sincronizarem dados novos.
 */
export function OfflineBanner() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    // Estado inicial — algumas vezes navigator.onLine mente, mas eh o melhor que temos
    setOnline(navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      setJustReconnected(true);
      // Re-sincroniza dados do server (Realtime + RSC)
      router.refresh();
      // Esconde o "Reconectado" depois de 2s
      const t = window.setTimeout(() => setJustReconnected(false), 2000);
      return () => window.clearTimeout(t);
    };

    const handleOffline = () => {
      setOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  if (online && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-3 py-2 text-center text-xs font-medium shadow-sm ${
        online ? "bg-emerald-600 text-white" : "bg-gold-400 text-graphite-900"
      }`}
      style={{
        // Respeita safe area do iOS (notch)
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
      }}
    >
      {online ? (
        <>
          <span aria-hidden>✓</span>
          <span>Reconectado — atualizando…</span>
        </>
      ) : (
        <>
          <span aria-hidden>⚠</span>
          <span>Você está offline. Páginas em cache continuam disponíveis.</span>
        </>
      )}
    </div>
  );
}
