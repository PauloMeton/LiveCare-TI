"use client";

// Componente "invisível" — não renderiza nada. Só fica escutando mudanças em
// tabelas via Supabase Realtime e chama router.refresh() quando algo muda,
// fazendo a Server Component pai re-fetchar e re-renderizar com os dados novos.
// Usar em páginas SSR que precisam manter-se "vivas" sem reload manual.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type RealtimeSub = {
  /** Nome único do canal (qualquer string). Mesmo nome = mesmo canal. */
  channel: string;
  /** Nome da tabela na schema public. */
  table: string;
  /**
   * Tipo de evento. "*" cobre INSERT/UPDATE/DELETE. Padrão: "*".
   */
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  /**
   * Filtro Postgres-style. Ex: "conversa_id=eq.abc-123" ou "id=eq.42".
   * Opcional — sem filtro escuta tudo na tabela (RLS continua filtrando o que vem).
   */
  filter?: string;
};

type Props = {
  subs: RealtimeSub[];
  /** Tempo mínimo (ms) entre refreshes consecutivos. Default 500ms. */
  debounceMs?: number;
};

export function RealtimeRefresher({ subs, debounceMs = 500 }: Props) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    function scheduleRefresh() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        router.refresh();
      }, debounceMs);
    }

    const channels = subs.map((s) => {
      const ch = supabase.channel(s.channel);
      ch.on(
        "postgres_changes",
        {
          event: s.event ?? "*",
          schema: "public",
          table: s.table,
          ...(s.filter ? { filter: s.filter } : {}),
        } as never,
        () => scheduleRefresh()
      );
      ch.subscribe();
      return ch;
    });

    return () => {
      if (timeout) clearTimeout(timeout);
      channels.forEach((c) => supabase.removeChannel(c));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(subs), debounceMs]);

  return null;
}
