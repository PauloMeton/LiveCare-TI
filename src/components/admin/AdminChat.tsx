"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-graphite-50">
      {/* Realtime — atualiza a lista de conversas e badges quando chega msg nova */}
      <RealtimeRefresher subs={[{ channel: "admin-chat-list", table: "livecare_messages" }]} />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — drawer mobile, fixa desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-shrink-0 flex-col border-r border-graphite-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-graphite-200 px-5 py-5">
          <BrandLockup size={36} />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Chamados
          </Link>
          <Link
            href="/admin/usuarios"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Usuários
          </Link>
          <div className="rounded-md bg-graphite-900 px-3 py-2 text-sm font-medium text-white">
            Chat
          </div>
          <Link
            href="/perfil"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Meu perfil
          </Link>
        </nav>
        <div className="border-t border-graphite-200 px-3 py-3">
          <div className="mb-2 px-3 py-2 text-[12px] text-graphite-600">
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

      {/* Lista de conversas — no mobile, esconde quando ja tem uma conversa selecionada */}
      <aside
        className={`w-full flex-shrink-0 flex-col border-r border-graphite-200 bg-white md:flex md:w-80 ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header mobile com hamburguer */}
        <div className="flex items-center gap-2 border-b border-graphite-200 px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-ml-1 rounded-md p-2 text-graphite-700 hover:bg-graphite-100"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
          <BrandLockup size={28} />
        </div>
        <div className="border-b border-graphite-200 px-5 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-600">
            Conversas
          </div>
          <div className="mt-1 text-sm text-graphite-500">
            {conversas.length} {conversas.length === 1 ? "funcionário" : "funcionários"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversas.length === 0 ? (
            <div className="p-6 text-center text-graphite-500">
              <div className="mb-2 text-3xl" aria-hidden>
                💬
              </div>
              <div className="text-sm font-medium text-graphite-700">Nenhuma conversa ainda</div>
              <div className="mt-1 text-xs">Quando um funcionário escrever, vai aparecer aqui.</div>
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
                      className={`block border-b border-graphite-100 px-4 py-3 transition-colors ${
                        isActive ? "bg-gold-50" : "hover:bg-graphite-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={c.nome ?? "?"} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="truncate text-sm font-semibold text-graphite-900">
                              {c.nome ?? "—"}
                            </div>
                            <div className="flex-shrink-0 text-[11px] text-graphite-500">
                              {formatListTime(c.last_at)}
                            </div>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <div className="flex-1 truncate text-[13px] text-graphite-600">
                              {wasMe && <span className="text-graphite-400">Você: </span>}
                              {c.last_conteudo}
                            </div>
                            {c.nao_lidas > 0 && (
                              <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-graphite-900">
                                {c.nao_lidas > 99 ? "99+" : c.nao_lidas}
                              </span>
                            )}
                          </div>
                          {c.cargo && (
                            <div className="mt-0.5 truncate text-[10px] text-graphite-400">
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

      {/* Thread (à direita) — no mobile, só visível quando ja tem conversa selecionada */}
      <main className={`flex min-w-0 flex-1 flex-col ${selectedId ? "flex" : "hidden md:flex"}`}>
        {selected ? (
          <>
            <header className="flex flex-shrink-0 items-center gap-3 border-b border-graphite-200 bg-white px-3 py-3">
              <Link
                href="/admin/chat"
                className="rounded-md p-1 text-graphite-700 hover:bg-graphite-100 md:hidden"
                aria-label="Voltar para lista"
              >
                ←
              </Link>
              <Avatar name={selected.nome ?? "?"} size={40} />
              <div className="min-w-0">
                <div className="truncate font-semibold text-graphite-900">
                  {selected.nome ?? "—"}
                </div>
                {selected.cargo && (
                  <div className="truncate text-xs text-graphite-500">{selected.cargo}</div>
                )}
              </div>
            </header>
            <div className="min-h-0 flex-1">
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
          <div className="flex flex-1 flex-col items-center justify-center text-graphite-500">
            <div className="mb-3 text-5xl" aria-hidden>
              💬
            </div>
            <div className="text-sm font-medium text-graphite-700">Selecione uma conversa</div>
            <div className="mt-1 text-xs">Escolha um funcionário na lista à esquerda.</div>
          </div>
        )}
      </main>
    </div>
  );
}
