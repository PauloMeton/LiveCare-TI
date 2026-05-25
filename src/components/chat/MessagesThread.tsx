"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  sendMessage,
  markConversationRead,
  deleteOwnMessage,
} from "@/app/chat/actions";
import type { Message } from "@/lib/types";

type Props = {
  conversaId: string;
  currentUserId: string;
  initialMessages: Message[];
  /** Dica mostrada quando não há mensagens (ex: "Mande a primeira mensagem pro suporte TI"). */
  emptyHint?: string;
};

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

export function MessagesThread({
  conversaId,
  currentUserId,
  initialMessages,
  emptyHint,
}: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset state quando muda de conversa (admin alternando entre funcionários)
  useEffect(() => {
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaId]);

  // Marca como lida na montagem e a cada mensagem nova chegando
  useEffect(() => {
    markConversationRead(conversaId).catch(() => {});
  }, [conversaId, messages.length]);

  // Auto-scroll pro fim quando lista cresce
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Subscription Realtime — INSERTs e UPDATEs na conversa
  useEffect(() => {
    const channel = supabase
      .channel(`livecare-messages:${conversaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livecare_messages",
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
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
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversaId, supabase]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const conteudo = text.trim();
    if (!conteudo || sending) return;
    setError(null);
    setSending(true);
    const r = await sendMessage({ conversaId, conteudo });
    setSending(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    setText("");
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta mensagem?")) return;
    const r = await deleteOwnMessage(id);
    if (r?.error) setError(r.error);
  }

  const visible = messages.filter((m) => !m.deleted_at);

  return (
    <div className="flex flex-col h-full bg-graphite-50">
      {/* Lista de bolhas */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {visible.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-graphite-500 text-center py-12">
            <div className="text-4xl mb-2" aria-hidden>
              💬
            </div>
            <div className="text-sm font-medium text-graphite-700">Nenhuma mensagem ainda</div>
            <div className="text-xs mt-1">{emptyHint ?? "Mande a primeira pra começar."}</div>
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

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-graphite-200 bg-white px-3 py-2 flex gap-2 items-end"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Digite uma mensagem…"
          disabled={sending}
          rows={1}
          maxLength={4000}
          className="flex-1 resize-none rounded-md border border-graphite-200 px-3 py-2 text-sm text-graphite-900 outline-none focus:border-graphite-900 max-h-32"
        />
        <Button type="submit" size="md" disabled={sending || !text.trim()}>
          {sending ? "Enviando…" : "Enviar"}
        </Button>
      </form>

      {error && (
        <div className="bg-danger-50 text-danger-700 text-sm px-3 py-2 border-t border-danger-50">
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
    <div className={`flex items-end gap-1 group ${isOwn ? "justify-end" : "justify-start"}`}>
      {isOwn && (
        <button
          onClick={onDelete}
          aria-label="Excluir mensagem"
          className="opacity-0 group-hover:opacity-100 text-graphite-400 hover:text-danger-600 text-sm px-1 transition-opacity"
        >
          ×
        </button>
      )}
      <div
        className={`max-w-[78%] sm:max-w-md rounded-lg px-3 py-2 ${
          isOwn
            ? "bg-gold-100 text-graphite-900 rounded-br-sm"
            : "bg-white border border-graphite-200 text-graphite-900 rounded-bl-sm"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.conteudo}</div>
        <div
          className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
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
  );
}
