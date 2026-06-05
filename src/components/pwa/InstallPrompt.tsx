"use client";

import { useEffect, useState } from "react";

/**
 * Banner discreto que oferece instalar o PWA.
 * - Android/Chrome/Edge: captura beforeinstallprompt e mostra "Instalar".
 * - iOS Safari: nao tem evento, mostra dica manual ("Compartilhar > Adicionar a Tela de Inicio").
 * - Se ja esta instalado (display-mode: standalone): nao mostra nada.
 * - Se o user dispensou: nao mostra de novo por 7 dias.
 */

const DISMISSED_KEY = "livecare-install-dismissed";
const DISMISS_DAYS = 7;

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Android/Chrome
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari (legacy)
  if (
    "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone
  ) {
    return true;
  }
  return false;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

function wasDismissedRecently(): boolean {
  try {
    const at = localStorage.getItem(DISMISSED_KEY);
    if (!at) return false;
    const dismissedAt = parseInt(at, 10);
    if (Number.isNaN(dismissedAt)) return false;
    const daysAgo = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysAgo < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // ja instalado
    if (wasDismissedRecently()) return;

    // Android / desktop Chrome
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as DeferredPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS: nao tem evento — verifica heuristica e mostra dica depois de 3s
    // (evita aparecer logo na primeira renderizacao, dando tempo do app carregar)
    if (isIOS()) {
      const t = window.setTimeout(() => setShowIosHint(true), 3000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setDeferred(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
    } else {
      // user clicou "não" no prompt nativo — esconde por 7 dias
      dismiss();
    }
  }

  if (dismissed) return null;
  if (!deferred && !showIosHint) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar app"
      className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-md rounded-lg border border-graphite-200 bg-white shadow-xl"
      style={{
        // Respeita safe area do iOS (notch / home indicator)
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gold-400 text-lg font-bold text-graphite-900">
          ⚡
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-graphite-900">Instalar LiveCare TI</div>
          {deferred ? (
            <p className="mt-0.5 text-xs text-graphite-600">
              Adicione à tela inicial pra abrir como app — mais rápido e funciona offline.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-graphite-600">
              Toque em{" "}
              <span aria-hidden className="font-semibold">
                ⬆️
              </span>{" "}
              <strong>Compartilhar</strong> e depois{" "}
              <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {deferred && (
              <button
                type="button"
                onClick={install}
                className="rounded-md bg-graphite-900 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Instalar
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-graphite-500 hover:text-graphite-900"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="-mr-1 -mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center text-lg leading-none text-graphite-400 hover:text-graphite-900"
        >
          ×
        </button>
      </div>
    </div>
  );
}
