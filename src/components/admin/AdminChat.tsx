"use client";

import Link from "next/link";
import type { Profile, ConversaListItem, Message } from "@/lib/types";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MessagesThread } from "@/components/chat/MessagesThread";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";

type Props = {
  profile: Profile;
  currentUserId: string;
  conversas: ConversaListItem[];
  selectedId: string | null;
  initialMessages: Message[];
};

function formatListTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";

  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function AdminChat({
  profile,
  currentUserId,
  conversas,
  selectedId,
  initialMessages,
}: Props) {
  const selected = conversas.find((c) => c.conversa_id === selectedId) ?? null;

  return (
    <div className="h-screen flex bg-graphite-50 overflow-hidden">
      {/* Realtime — atualiza a lista de conversas e badges quando chega msg nova */}
      <RealtimeRefresher
        subs={[{ channel: "admin-chat-list", table: "livecare_messages" }]}
      />

      {/* Sidebar (igual ao AdminDashboard) */}
      <aside className="w-64 bg-white border-r border-graphite-200 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-graphite-200">
          <BrandLockup size={36} />
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-md text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Chamados
          </Link>
          <Link
            href="/admin/usuarios"
            className="px-3 py-2 rounded-md text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Usuários
          </Link>
          <div className="px-3 py-2 rounded-md text-sm font-medium bg-graphite-900 text-white">
            Chat
          </div>
          <Link
            href="/perfil"
            className="px-3 py-2 rounded-md text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Meu perfil
          </Link>
        </nav>
        <div className="px-3 py-3 border-t border-graphite-200">
          <div className="px-3 py-2 mb-2 text-[12px] text-graphite-600">
            <div className="font-semibold text-graphite-900">{profile.nome}</div>
            <div className="text-[11px] text-gold-700">Suporte TI · Admin</div>
          </div>
          <form action="/logout" method="POST">
            <Button variant="ghost" full size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Lista de conversas */}
      <aside className="w-80 bg-white border-r border-graphite-200 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-graphite-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-600">
            Conversas
          </div>
          <div className="text-sm text-graphite-500 mt-1">
            {conversas.length} {conversas.length === 1 ? "funcionário" : "funcionários"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversas.length === 0 ? (
            <div className="p-6 text-center text-graphite-500">
              <div className="text-3xl mb-2" aria-hidden>
                💬
              </div>
              <div className="text-sm font-medium text-graphite-700">Nenhuma conversa ainda</div>
              <div className="text-xs mt-1">
                Quando um funcionário escrever, vai aparecer aqui.
              </div>
            </div>
          ) : (
            <ul>
              {conversas.map((c) => {
                const isActive = c.conversa_id === selectedId;
                const wasMe = c.last_autor_id === currentUserId;
                return (
                  <li key={c.conversa_id}>
                    <Link
                      href={`/admin/chat?c=${c.conversa_id}`}
                      className={`block px-4 py-3 border-b border-graphite-100 transition-colors ${
                        isActive ? "bg-gold-50" : "hover:bg-graphite-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={c.nome ?? "?"} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="font-semibold text-sm text-graphite-900 truncate">
                              {c.nome ?? "—"}
                            </div>
                            <div className="text-[11px] text-graphite-500 flex-shrink-0">
                              {formatListTime(c.last_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-[13px] text-graphite-600 truncate flex-1">
                              {wasMe && (
                                <span className="text-graphite-400">Você: </span>
                              )}
                              {c.last_conteudo}
                            </div>
                            {c.nao_lidas > 0 && (
                              <span className="bg-gold-400 text-graphite-900 text-[10px] font-bold rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center flex-shrink-0">
                                {c.nao_lidas > 99 ? "99+" : c.nao_lidas}
                              </span>
                            )}
                          </div>
                          {c.cargo && (
                            <div className="text-[10px] text-graphite-400 truncate mt-0.5">
                              {c.cargo}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread (à direita) */}
      <main className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <header className="bg-white border-b border-graphite-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <Avatar name={selected.nome ?? "?"} size={40} />
              <div>
                <div className="font-semibold text-graphite-900">{selected.nome ?? "—"}</div>
                {selected.cargo && (
                  <div className="text-xs text-graphite-500">{selected.cargo}</div>
                )}
              </div>
            </header>
            <div className="flex-1 min-h-0">
              <MessagesThread
                key={selected.conversa_id}
                conversaId={selected.conversa_id}
                currentUserId={currentUserId}
                initialMessages={initialMessages}
                emptyHint={`Sem mensagens com ${selected.nome ?? "este funcionário"} ainda.`}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-graphite-500">
            <div className="text-5xl mb-3" aria-hidden>
              💬
            </div>
            <div className="text-sm font-medium text-graphite-700">
              Selecione uma conversa
            </div>
            <div className="text-xs mt-1">
              Escolha um funcionário na lista à esquerda.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
