"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (/sw.js) na primeira renderizacao.
 * - So roda em producao (em dev atrapalha o HMR do Next).
 * - Silencioso em browsers sem suporte (IE, etc).
 * - Se houver SW novo disponivel, atualiza em background na proxima visita.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Quando uma nova versao do SW estiver instalada (mas ainda esperando),
        // atualiza assim que o usuario fechar a aba — fluxo padrao.
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            // statechange = "installed" + ja tem SW ativo = update disponivel
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              // Forca skipWaiting pra que a proxima navegacao use a versao nova
              next.postMessage("SKIP_WAITING");
            }
          });
        });
      } catch {
        // Falha silenciosa — PWA degrada gracefully pra site normal
      }
    };

    // Aguarda load pra nao competir com o paint inicial
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
