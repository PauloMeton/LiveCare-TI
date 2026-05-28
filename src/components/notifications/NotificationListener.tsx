"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { pushToast } from "@/components/notifications/Toaster";

type Props = {
  currentUserId: string;
  isAdmin: boolean;
};

type TicketRow = {
  id: string;
  autor_id: string;
  status: string;
  titulo: string;
};

type MessageRow = {
  id: number;
  conversa_id: string;
  autor_id: string;
  conteudo: string;
};

/** Preview de mensagem: corta em 80 chars e mostra "[anexo]" se vazio. */
function previewConteudo(c: string | null | undefined): string {
  const t = (c ?? "").trim();
  if (!t) return "[anexo]";
  return t.length > 80 ? t.slice(0, 80) + "…" : t;
}

// Log helper só no browser, prefixado pra ficar fácil de achar no DevTools
function log(...args: unknown[]) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[livecare-notif]", ...args);
  }
}

export function NotificationListener({ currentUserId, isAdmin }: Props) {
  useEffect(() => {
    log("init", { currentUserId, isAdmin });
    const supabase = createClient();

    // Cache de profiles pra mostrar nome no toast sem N+1
    const profileCache = new Map<string, string>();
    async function getNome(userId: string): Promise<string> {
      const cached = profileCache.get(userId);
      if (cached) return cached;
      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", userId)
        .maybeSingle<{ nome: string | null }>();
      const nome = data?.nome ?? "Funcionário";
      profileCache.set(userId, nome);
      return nome;
    }

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (isAdmin) {
      // --- ADMIN ---

      // (1) Novo chamado postado (INSERT em livecare_tickets)
      channels.push(
        supabase
          .channel("notif-admin-novo-chamado")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "livecare_tickets" },
            async (payload) => {
              log("admin: novo chamado", payload.new);
              const t = payload.new as TicketRow;
              if (!t) return;
              const nome = await getNome(t.autor_id);
              pushToast({
                title: "Novo chamado",
                subtitle: `${nome}: ${t.titulo}`,
                href: `/chamados/${t.id}`,
                tone: "info",
              });
            }
          )
          .subscribe((status) => log("ch:admin-novo-chamado", status))
      );

      // (2) Nova mensagem de qualquer funcionário (INSERT em livecare_messages onde autor != admin)
      channels.push(
        supabase
          .channel("notif-admin-novas-mensagens")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "livecare_messages" },
            async (payload) => {
              log("admin: nova mensagem", payload.new);
              const m = payload.new as MessageRow;
              if (!m) return;
              if (m.autor_id === currentUserId) return;
              const nome = await getNome(m.autor_id);
              pushToast({
                title: `Nova mensagem · ${nome}`,
                subtitle: previewConteudo(m.conteudo),
                href: `/admin/chat?c=${m.conversa_id}`,
                tone: "success",
              });
            }
          )
          .subscribe((status) => log("ch:admin-novas-msgs", status))
      );
    } else {
      // --- FUNCIONÁRIO ---

      // (3) Status do próprio chamado mudou pra "concluido" ou "aberto" (reaberto)
      //     UPDATE em livecare_tickets filtrado por autor_id=eq.<currentUserId>
      channels.push(
        supabase
          .channel("notif-user-status-chamados")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "livecare_tickets",
              filter: `autor_id=eq.${currentUserId}`,
            },
            (payload) => {
              log("user: update do meu chamado", payload.new, "old:", payload.old);
              const t = payload.new as TicketRow;
              const old = payload.old as Partial<TicketRow> | undefined;
              if (!t) return;
              // Só notifica se o status realmente mudou
              if (old && old.status === t.status) return;

              if (t.status === "concluido") {
                pushToast({
                  title: "Chamado concluído",
                  subtitle: t.titulo,
                  href: `/chamados/${t.id}`,
                  tone: "success",
                });
              } else if (t.status === "aberto") {
                // UPDATE pra "aberto" só acontece via reabrir (INSERT nasce 'aberto' direto)
                pushToast({
                  title: "Chamado reaberto",
                  subtitle: t.titulo,
                  href: `/chamados/${t.id}`,
                  tone: "warning",
                });
              }
            }
          )
          .subscribe((status) => log("ch:user-status-chamados", status))
      );

      // (4) Nova mensagem do admin no chat do funcionário
      //     Filtro: conversa_id=eq.<currentUserId> AND autor_id != currentUserId
      channels.push(
        supabase
          .channel("notif-user-novas-mensagens")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "livecare_messages",
              filter: `conversa_id=eq.${currentUserId}`,
            },
            (payload) => {
              log("user: nova mensagem no meu chat", payload.new);
              const m = payload.new as MessageRow;
              if (!m) return;
              if (m.autor_id === currentUserId) return;
              pushToast({
                title: "Nova mensagem do suporte",
                subtitle: previewConteudo(m.conteudo),
                href: "/chat",
                tone: "success",
              });
            }
          )
          .subscribe((status) => log("ch:user-novas-msgs", status))
      );
    }

    return () => {
      log("cleanup", channels.length, "canais");
      channels.forEach((ch) => {
        supabase.removeChannel(ch);
      });
    };
  }, [currentUserId, isAdmin]);

  return null;
}
