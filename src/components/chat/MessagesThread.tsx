"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { sendMessage, markConversationRead, deleteOwnMessage } from "@/app/chat/actions";
import { ATTACHMENTS_BUCKET, getSignedUrl } from "@/lib/chatAttachments";
import type { Message, AttachmentType } from "@/lib/types";

type Props = {
  conversaId: string;
  currentUserId: string;
  initialMessages: Message[];
  emptyHint?: string;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — alinhado com o bucket
const ACCEPTED_MIME =
  "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

function formatBubbleTime(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function detectType(file: File): AttachmentType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function extOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "bin";
}

export function MessagesThread({ conversaId, currentUserId, initialMessages, emptyHint }: Props) {
  // Memoiza o client pra evitar loop de reconexao do realtime
  // (cada render criava nova referencia e o useEffect cleanup desconectava o canal)
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state quando muda de conversa
  useEffect(() => {
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaId]);

  // Marca como lida na montagem e em cada nova mensagem
  useEffect(() => {
    markConversationRead(conversaId).catch(() => {});
  }, [conversaId, messages.length]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Cleanup preview URL no unmount
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  // ============================================================
  // REALTIME via WebSocket (Supabase Realtime / postgres_changes)
  //
  // Estrategia:
  // - INSERT/UPDATE chegam via WS push (latencia tipica ~100ms).
  // - Handler de status loga estado da conexao no console pra debug.
  // - Em SUBSCRIBED (conectou OU reconectou): faz refetch pra pegar
  //   mensagens que possam ter chegado durante uma desconexao breve.
  // - Em CHANNEL_ERROR / TIMED_OUT / CLOSED: o supabase-js reconecta
  //   sozinho exponencialmente; nao precisamos fazer nada manual.
  // - visibilitychange: quando o user volta a aba, refetch (cobre o caso
  //   do navegador ter pausado o WS em background no mobile).
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function refetch(reason: string) {
      if (cancelled) return;
      const { data, error: e } = await supabase
        .from("livecare_messages")
        .select(
          "id, conversa_id, autor_id, conteudo, read_at, deleted_at, created_at, attachment_path, attachment_type, attachment_size"
        )
        .eq("conversa_id", conversaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (e) {
        console.warn("[chat] refetch erro:", reason, e.message);
        return;
      }
      if (!data) return;

      const ordered = data as Message[];

      setMessages((prev) => {
        // Mantem signed URLs ja resolvidas
        const prevById = new Map(prev.map((m) => [m.id, m] as const));
        // Mantem mensagens otimistas (id < 0) que ainda nao tem versao real
        const realServerKeys = new Set(
          ordered.map((m) => `${m.autor_id}|${m.conteudo}|${m.attachment_path ?? ""}`)
        );
        const optimistic = prev.filter(
          (m) =>
            m.id < 0 &&
            !realServerKeys.has(`${m.autor_id}|${m.conteudo}|${m.attachment_path ?? ""}`)
        );
        const merged = ordered.map((m) => {
          const old = prevById.get(m.id);
          return old && old.attachment_url ? { ...m, attachment_url: old.attachment_url } : m;
        });
        const final = [...merged, ...optimistic];
        // Diff pra evitar re-render desnecessario
        if (
          final.length === prev.length &&
          final.every((m, i) => m.id === prev[i]?.id && m.read_at === prev[i]?.read_at)
        ) {
          return prev;
        }
        return final;
      });

      // Resolve signed URLs em background pra anexos novos sem url
      ordered
        .filter((m) => m.attachment_path && !m.attachment_url)
        .forEach(async (m) => {
          const url = await getSignedUrl(supabase, m.attachment_path!);
          if (cancelled) return;
          setMessages((prev) =>
            prev.map((x) => (x.id === m.id ? { ...x, attachment_url: url } : x))
          );
        });
    }

    const channel = supabase
      .channel(`livecare-messages:${conversaId}`, {
        config: {
          // Garante que o broadcast/postgres_changes use a sessao autenticada
          // do user logado (necessario pra respeitar RLS)
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livecare_messages",
          filter: `conversa_id=eq.${conversaId}`,
        },
        async (payload) => {
          const m = payload.new as Message;
          if (m.attachment_path) {
            const url = await getSignedUrl(supabase, m.attachment_path);
            m.attachment_url = url;
          }
          setMessages((prev) => {
            // Dedupe: se ja existe pelo id, mantem.
            if (prev.some((x) => x.id === m.id)) return prev;
            // Remove optimistic correspondente (mesmo autor + conteudo + anexo)
            const key = `${m.autor_id}|${m.conteudo}|${m.attachment_path ?? ""}`;
            const withoutOptimistic = prev.filter(
              (x) => !(x.id < 0 && `${x.autor_id}|${x.conteudo}|${x.attachment_path ?? ""}` === key)
            );
            return [...withoutOptimistic, m];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "livecare_messages",
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.map((x) => (x.id === m.id ? { ...m, attachment_url: x.attachment_url } : x))
          );
        }
      )
      .subscribe((status, err) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          // Conectado (ou reconectado) — sincroniza estado caso tenha perdido eventos
          console.info("[chat] WS conectado:", conversaId);
          void refetch("subscribed");
        } else if (status === "CHANNEL_ERROR") {
          console.warn("[chat] WS erro no canal:", err?.message ?? "");
        } else if (status === "TIMED_OUT") {
          console.warn("[chat] WS timeout — supabase-js vai reconectar");
        } else if (status === "CLOSED") {
          console.info("[chat] WS fechado");
        }
      });

    // Refetch quando a aba volta a ficar visivel
    // (mobile pausa WS em background; ao voltar, podemos ter perdido mensagens)
    function onVisible() {
      if (document.visibilityState === "visible") {
        void refetch("visible");
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [conversaId, supabase]);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Arquivo muito grande. Máximo 25 MB.");
      e.target.value = "";
      return;
    }
    const kind = detectType(file);
    if (!kind) {
      setError("Tipo não suportado. Mande imagem (PNG/JPG/WEBP/GIF) ou vídeo (MP4/WEBM/MOV).");
      e.target.value = "";
      return;
    }
    setError(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  }

  function clearPending() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const conteudo = text.trim();
    if ((!conteudo && !pendingFile) || sending) return;
    setError(null);
    setSending(true);

    let attachmentPath: string | null = null;
    let attachmentType: AttachmentType | null = null;
    let attachmentSize: number | null = null;

    // Upload do anexo (se houver)
    if (pendingFile) {
      const kind = detectType(pendingFile);
      if (!kind) {
        setError("Tipo de arquivo inválido.");
        setSending(false);
        return;
      }
      attachmentType = kind;
      attachmentSize = pendingFile.size;
      setUploadProgress(0);

      const ext = extOf(pendingFile.name);
      const safeRand = crypto.randomUUID();
      // Path obrigatoriamente começa com conversa_id (regra RLS do storage)
      const path = `${conversaId}/${safeRand}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(path, pendingFile, {
          contentType: pendingFile.type,
          upsert: false,
        });

      if (upErr) {
        setError(`Falha ao subir anexo: ${upErr.message}`);
        setSending(false);
        setUploadProgress(null);
        return;
      }
      attachmentPath = path;
      setUploadProgress(100);
    }

    // OPTIMISTIC UPDATE — mostra a mensagem na hora, sem esperar realtime/polling
    // Usa id negativo temporario; o polling/realtime substitui pelo real depois
    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      conversa_id: conversaId,
      autor_id: currentUserId,
      conteudo,
      read_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      attachment_path: attachmentPath,
      attachment_type: attachmentType,
      attachment_size: attachmentSize,
      attachment_url: pendingPreview ?? null,
    };
    setMessages((prev) => [...prev, optimistic]);
    // Limpa input imediatamente — UX melhor
    setText("");
    clearPending();

    const r = await sendMessage({
      conversaId,
      conteudo,
      attachmentPath,
      attachmentType,
      attachmentSize,
    });
    setSending(false);
    setUploadProgress(null);

    if (r.error) {
      setError(r.error);
      // Rollback do optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      // Se o anexo subiu mas a mensagem falhou, tenta limpar
      if (attachmentPath) {
        await supabase.storage
          .from(ATTACHMENTS_BUCKET)
          .remove([attachmentPath])
          .catch(() => {});
      }
      return;
    }
    // Sucesso — polling/realtime vai trazer o registro real em segundos
    // e o useEffect do polling faz dedupe por id real, substituindo o temporario
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta mensagem?")) return;
    const r = await deleteOwnMessage(id);
    if (r?.error) setError(r.error);
  }

  const visible = messages.filter((m) => !m.deleted_at);
  const canSend = !sending && (text.trim().length > 0 || pendingFile !== null);

  return (
    <div className="flex h-full flex-col bg-graphite-50">
      {/* Lista de bolhas */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center text-graphite-500">
            <div className="mb-2 text-4xl" aria-hidden>
              💬
            </div>
            <div className="text-sm font-medium text-graphite-700">Nenhuma mensagem ainda</div>
            <div className="mt-1 text-xs">{emptyHint ?? "Mande a primeira pra começar."}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                isOwn={m.autor_id === currentUserId}
                onDelete={() => handleDelete(m.id)}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Preview do anexo selecionado */}
      {pendingFile && pendingPreview && (
        <div className="flex items-center gap-3 border-t border-graphite-200 bg-white px-3 py-2">
          {pendingFile.type.startsWith("image/") ? (
            <img
              src={pendingPreview}
              alt="Pré-visualização"
              className="h-14 w-14 rounded-md border border-graphite-200 object-cover"
            />
          ) : (
            <video
              src={pendingPreview}
              className="h-14 w-14 rounded-md border border-graphite-200 object-cover"
              muted
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-graphite-900">{pendingFile.name}</div>
            <div className="text-xs text-graphite-500">
              {formatBytes(pendingFile.size)}
              {uploadProgress !== null &&
                ` · ${uploadProgress === 100 ? "enviado" : "enviando..."}`}
            </div>
          </div>
          <button
            type="button"
            onClick={clearPending}
            disabled={sending}
            aria-label="Remover anexo"
            className="px-1 text-xl text-graphite-500 hover:text-danger-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-graphite-200 bg-white px-3 py-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME}
          onChange={handlePickFile}
          className="hidden"
          disabled={sending}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Anexar imagem ou vídeo"
          title="Anexar imagem ou vídeo (máx 25 MB)"
          className="flex-shrink-0 self-center px-2 text-xl leading-none text-graphite-500 hover:text-graphite-900 disabled:opacity-50"
        >
          📎
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={pendingFile ? "Adicione uma legenda (opcional)…" : "Digite uma mensagem…"}
          disabled={sending}
          rows={1}
          maxLength={4000}
          className="max-h-32 flex-1 resize-none rounded-md border border-graphite-200 px-3 py-2 text-sm text-graphite-900 outline-none focus:border-graphite-900"
        />
        <Button type="submit" size="md" disabled={!canSend}>
          {sending ? "Enviando…" : "Enviar"}
        </Button>
      </form>

      {error && (
        <div className="border-t border-danger-50 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      )}
    </div>
  );
}

function Bubble({
  message,
  isOwn,
  onDelete,
}: {
  message: Message;
  isOwn: boolean;
  onDelete: () => void;
}) {
  return (
    <div className={`group flex items-end gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
      {isOwn && (
        <button
          onClick={onDelete}
          aria-label="Excluir mensagem"
          className="px-1 text-sm text-graphite-400 opacity-0 transition-opacity hover:text-danger-600 group-hover:opacity-100"
        >
          ×
        </button>
      )}
      <div
        className={`max-w-[78%] overflow-hidden rounded-lg sm:max-w-md ${
          isOwn
            ? "rounded-br-sm bg-gold-100 text-graphite-900"
            : "rounded-bl-sm border border-graphite-200 bg-white text-graphite-900"
        }`}
      >
        {/* Anexo */}
        {message.attachment_path && message.attachment_url && (
          <AttachmentView type={message.attachment_type} url={message.attachment_url} />
        )}

        {/* Texto + meta */}
        <div className="px-3 py-2">
          {message.conteudo && (
            <div className="whitespace-pre-wrap break-words text-sm">{message.conteudo}</div>
          )}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              isOwn ? "text-graphite-600" : "text-graphite-500"
            }`}
          >
            <span>{formatBubbleTime(message.created_at)}</span>
            {isOwn && (
              <span
                className={message.read_at ? "text-emerald-600" : ""}
                aria-label={message.read_at ? "Mensagem lida" : "Mensagem enviada"}
                title={message.read_at ? "Lida" : "Enviada"}
              >
                {message.read_at ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachmentView({ type, url }: { type: AttachmentType | null; url: string }) {
  if (type === "image") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir imagem em tamanho real"
      >
        <img
          src={url}
          alt="Anexo"
          className="block max-h-80 max-w-full cursor-zoom-in object-cover"
          loading="lazy"
        />
      </a>
    );
  }
  if (type === "video") {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        className="block max-h-80 max-w-full bg-graphite-900"
      />
    );
  }
  return null;
}
