"use client";

import { useEffect, useState } from "react";
import { isChatSoundEnabled, setChatSoundEnabled, playNotifySound } from "@/lib/notifySound";

/**
 * Toggle pra silenciar/ativar o som de notificacao do chat in-app.
 * Persiste preferencia no localStorage.
 *
 * Diferente do push (que toca som do SO em background): isso eh o som
 * que toca DENTRO do app quando a aba ta aberta e foca.
 */
export function ChatSoundToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  // Carrega estado inicial no client (evita hydration mismatch)
  useEffect(() => {
    setEnabled(isChatSoundEnabled());
  }, []);

  if (enabled === null) return null;

  function toggle() {
    const next = !enabled;
    setChatSoundEnabled(next);
    setEnabled(next);
    // Toca o som no ato de ativar pra user confirmar que funciona
    if (next) playNotifySound();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-graphite-900">Som ao receber mensagem</div>
        <div className="text-xs text-graphite-500">
          Toca um som curto quando chega mensagem com o app aberto.
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? "Silenciar som do chat" : "Ativar som do chat"}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors ${
          enabled ? "bg-graphite-900" : "bg-graphite-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
