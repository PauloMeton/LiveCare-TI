"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/** Tom visual do toast — afeta a cor do "olho" lateral. */
export type ToastTone = "info" | "success" | "warning";

export type ToastPayload = {
  id?: string;
  title: string;
  subtitle?: string;
  href?: string;
  tone?: ToastTone;
};

const TOAST_DURATION_MS = 6000;
const TOAST_EVENT = "livecare:toast";

/**
 * Toca um "ping" curto via Web Audio API quando um toast aparece.
 * - Sintetizado na hora (sem dependência de arquivo .mp3)
 * - Volume bem baixo (não incomoda)
 * - Falha silenciosa se o browser bloquear (autoplay policy antes da 1a interação)
 */
let audioCtx: AudioContext | null = null;
function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    type AudioCtor = typeof AudioContext;
    const Ctor: AudioCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return;

    if (!audioCtx) audioCtx = new Ctor();
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // Browser bloqueou audio antes da 1a interação — ignora
  }
}

/**
 * Helper pra disparar um toast de qualquer client component sem precisar de Context.
 * Uso: pushToast({ title: "Nova mensagem", href: "/chat" })
 */
export function pushToast(t: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, {
      detail: { id: crypto.randomUUID(), ...t },
    })
  );
}

type Active = Required<Pick<ToastPayload, "id" | "title">> & ToastPayload & {
  closing?: boolean;
};

const toneColor: Record<ToastTone, string> = {
  info: "#3266ad",
  success: "#0e8a4a",
  warning: "var(--gold-600, #c79b00)",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Active[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const ev = e as CustomEvent<ToastPayload>;
      const detail = ev.detail;
      if (!detail || !detail.title) return;
      const id = detail.id ?? crypto.randomUUID();

      let added = false;
      setToasts((prev) => {
        // Dedupe: se chegar dois iguais em sequência, só mostra o primeiro
        if (prev.some((t) => t.title === detail.title && t.subtitle === detail.subtitle)) {
          return prev;
        }
        added = true;
        return [...prev, { ...detail, id, title: detail.title }];
      });

      // Só toca o som se o toast realmente entrou (não era duplicado)
      if (added) playNotificationSound();

      // Auto-dismiss
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION_MS);
    }

    window.addEventListener(TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, onToast as EventListener);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
        width: "calc(100vw - 32px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const tone = t.tone ?? "info";
        const body = (
          <div
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "stretch",
              gap: 0,
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              overflow: "hidden",
              animation: "livecareToastIn 220ms ease-out",
            }}
          >
            <div style={{ width: 4, background: toneColor[tone], flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "10px 12px", minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.title}
              </div>
              {t.subtitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#555",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {t.subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fechar"
              style={{
                pointerEvents: "auto",
                background: "transparent",
                border: 0,
                color: "#888",
                fontSize: 18,
                lineHeight: 1,
                padding: "0 12px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        );

        return (
          <div key={t.id}>
            {t.href ? (
              <Link
                href={t.href}
                onClick={() => dismiss(t.id)}
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes livecareToastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
