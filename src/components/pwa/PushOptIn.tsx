"use client";

import { useEffect, useState, useTransition } from "react";
import { savePushSubscription, deletePushSubscription } from "@/app/push/actions";

type Status = "loading" | "unsupported" | "granted" | "denied" | "default" | "no-vapid";

/**
 * Converte string base64url (VAPID public key) pra Uint8Array com ArrayBuffer.
 * Importante: aloca um ArrayBuffer explícito (não SharedArrayBuffer) porque
 * a Web Push API exige Uint8Array<ArrayBuffer> (BufferSource) — TS 5.7+ checa isso.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Std = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Std);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushOptIn() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!vapidPublic) {
      setStatus("no-vapid");
      return;
    }
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }
    // permission é "default" | "granted" | "denied"
    setStatus(Notification.permission as Status);
  }, [vapidPublic]);

  async function enable() {
    setFeedback(null);
    if (!vapidPublic) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission as Status);
        setFeedback(
          permission === "denied"
            ? "Permissão negada — habilite nas configurações do navegador pra receber alertas."
            : "Permissão não concedida."
        );
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        }));

      const json = sub.toJSON();
      startTransition(async () => {
        const r = await savePushSubscription({
          endpoint: json.endpoint!,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          userAgent: navigator.userAgent.slice(0, 500),
        });
        if (r?.error) {
          setFeedback(r.error);
        } else {
          setStatus("granted");
          setFeedback("Notificações ativadas neste dispositivo.");
        }
      });
    } catch (err) {
      setFeedback(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function disable() {
    setFeedback(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setStatus("default");
        return;
      }
      await sub.unsubscribe();
      startTransition(async () => {
        const r = await deletePushSubscription(sub.endpoint);
        if (r?.error) setFeedback(r.error);
        else {
          setStatus("default");
          setFeedback("Notificações desativadas neste dispositivo.");
        }
      });
    } catch (err) {
      setFeedback(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Em produção real, esses estados podem ser combinados em UI mais sutil.
  if (status === "loading") return null;
  if (status === "no-vapid") {
    return (
      <p className="text-xs text-graphite-500">Notificações push não configuradas no servidor.</p>
    );
  }
  if (status === "unsupported") {
    return (
      <p className="text-xs text-graphite-500">
        Seu navegador não suporta notificações push. Use Chrome ou Safari recente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-graphite-900">Notificações no celular</div>
          <div className="text-xs text-graphite-500">
            {status === "granted"
              ? "Você recebe alertas quando o status do chamado muda ou chega mensagem."
              : status === "denied"
                ? "Permissão negada. Libere nas configurações do navegador."
                : "Receba alertas mesmo com o app fechado."}
          </div>
        </div>
        {status === "granted" ? (
          <button
            type="button"
            onClick={disable}
            disabled={pending}
            className="rounded-md border border-graphite-200 px-3 py-1.5 text-xs font-semibold text-graphite-700 hover:border-graphite-400 disabled:opacity-60"
          >
            {pending ? "..." : "Desativar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={pending || status === "denied"}
            className="rounded-md bg-graphite-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "..." : "Ativar"}
          </button>
        )}
      </div>
      {feedback && <div className="text-xs text-graphite-600">{feedback}</div>}
    </div>
  );
}
