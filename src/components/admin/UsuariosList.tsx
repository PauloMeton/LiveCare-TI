"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import {
  setUserRole,
  setUserEmail,
  setUserPassword,
  suspendUser,
  unsuspendUser,
  deleteUser,
  type ListedUser,
} from "@/app/admin/usuarios/actions";

type Props = {
  currentUserId: string;
  currentUserIsLider: boolean;
  users: ListedUser[];
  loadError: string | null;
};

export function UsuariosList({ currentUserId, currentUserIsLider, users, loadError }: Props) {
  const [selected, setSelected] = useState<ListedUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-graphite-50">
      {/* Realtime — refresca quando alguém se cadastra ou tem profile alterado */}
      <RealtimeRefresher subs={[{ channel: "admin-usuarios-profiles", table: "profiles" }]} />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-graphite-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-graphite-200 px-5 py-5">
          <BrandLockup size={36} />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-2xl leading-none text-graphite-500 lg:hidden"
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Chamados
          </Link>
          <div className="rounded-md bg-graphite-900 px-3 py-2 text-sm font-medium text-white">
            Usuários
          </div>
          <Link
            href="/admin/chat"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Chat
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Analytics
          </Link>
          <Link
            href="/perfil"
            className="rounded-md px-3 py-2 text-sm font-medium text-graphite-700 hover:bg-graphite-100"
          >
            Meu perfil
          </Link>
        </nav>
        <div className="border-t border-graphite-200 px-3 py-3">
          <form action="/logout" method="POST">
            <Button variant="ghost" full size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <main className="max-w-[1400px] flex-1 overflow-auto p-4 lg:p-8">
        {/* Header mobile com hamburguer */}
        <div className="mb-4 flex items-center gap-3 lg:hidden">
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

        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gold-600">
          Suporte TI · Administração
        </div>
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-graphite-900">Usuários</h1>
        <p className="mb-6 text-sm text-graphite-500">
          {users.length} {users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}.
        </p>

        {loadError && (
          <div className="mb-6 rounded-md border border-danger-50 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {loadError}
          </div>
        )}

        {users.length === 0 && !loadError ? (
          <div className="rounded-lg border border-graphite-200 bg-white p-10 text-center text-graphite-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-graphite-200 bg-white">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-3 border-b border-graphite-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-graphite-600">
              <div>Nome</div>
              <div>E-mail</div>
              <div>Papel</div>
              <div>Status</div>
              <div className="text-right">Ações</div>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center gap-3 border-b border-graphite-100 px-5 py-3 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={u.nome ?? "?"}
                    size={32}
                    color={u.lider ? "var(--gold-100, #fff3b0)" : undefined}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate font-semibold text-graphite-900">
                      {u.nome ?? "—"}
                      {u.lider && (
                        <span
                          className="text-gold-600"
                          title="Líder admin"
                          aria-label="Líder admin"
                        >
                          ★
                        </span>
                      )}
                      {u.id === currentUserId && (
                        <span className="ml-1 text-[10px] uppercase tracking-wider text-graphite-400">
                          (você)
                        </span>
                      )}
                    </div>
                    {u.cargo && (
                      <div className="truncate text-[11px] text-graphite-500">{u.cargo}</div>
                    )}
                  </div>
                </div>
                <div className="truncate text-graphite-700">{u.email}</div>
                <div>
                  {u.role === "admin" ? (
                    <Pill tone="warn">Admin</Pill>
                  ) : (
                    <Pill tone="neutral">Funcionário</Pill>
                  )}
                </div>
                <div>
                  {u.suspenso ? (
                    <Pill tone="danger">Suspenso</Pill>
                  ) : (
                    <Pill tone="success">Ativo</Pill>
                  )}
                </div>
                <div className="text-right">
                  <Button size="sm" variant="secondary" onClick={() => setSelected(u)}>
                    Gerenciar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <ManageUserModal
          user={selected}
          currentUserId={currentUserId}
          currentUserIsLider={currentUserIsLider}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   MODAL DE GERENCIAMENTO
   ============================================================ */
function ManageUserModal({
  user,
  currentUserId,
  currentUserIsLider,
  onClose,
}: {
  user: ListedUser;
  currentUserId: string;
  currentUserIsLider: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const isSelf = user.id === currentUserId;
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function ack(msg: string, kind: "ok" | "err" = "ok") {
    setFeedback({ kind, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleRole() {
    const target = user.role === "admin" ? "user" : "admin";
    const verbo = target === "admin" ? "promover" : "rebaixar";
    if (!confirm(`Deseja ${verbo} ${user.nome ?? user.email}?`)) return;
    startTransition(async () => {
      const r = await setUserRole({ userId: user.id, role: target });
      if (r.error) ack(r.error, "err");
      else {
        ack(target === "admin" ? "Promovido a admin." : "Rebaixado a funcionário.");
        router.refresh();
      }
    });
  }

  function handleSuspend() {
    const acao = user.suspenso ? "reativar" : "suspender";
    if (!confirm(`Deseja ${acao} ${user.nome ?? user.email}?`)) return;
    startTransition(async () => {
      const r = user.suspenso ? await unsuspendUser(user.id) : await suspendUser(user.id);
      if (r.error) ack(r.error, "err");
      else {
        ack(user.suspenso ? "Conta reativada." : "Conta suspensa.");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const r = await deleteUser(user.id);
      if (r.error) {
        ack(r.error, "err");
        setConfirmDelete(false);
      } else {
        ack("Usuário excluído.");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 600);
      }
    });
  }

  function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (newEmail === user.email) {
      ack("E-mail não mudou.", "err");
      return;
    }
    startTransition(async () => {
      const r = await setUserEmail({ userId: user.id, email: newEmail });
      if (r.error) ack(r.error, "err");
      else {
        ack("E-mail atualizado.");
        router.refresh();
      }
    });
  }

  function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await setUserPassword({ userId: user.id, password: newPassword });
      if (r.error) ack(r.error, "err");
      else {
        ack("Senha alterada com sucesso.");
        setNewPassword("");
      }
    });
  }

  // Regras de habilitação dos botões
  const canChangeRole = !isSelf; // o banco bloqueia self-role-change para todos
  const canSuspend = currentUserIsLider || !isSelf; // líder pode se auto-suspender
  const canDelete = !isSelf; // banco bloqueia self-delete para todos

  return (
    <Modal open onClose={onClose} title="Gerenciar usuário" size="lg">
      <div className="flex flex-col gap-4">
        {/* Cabeçalho com identidade */}
        <div className="flex items-center gap-3 border-b border-graphite-100 pb-3">
          <Avatar
            name={user.nome ?? "?"}
            size={48}
            color={user.lider ? "var(--gold-100, #fff3b0)" : undefined}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate font-semibold text-graphite-900">
              {user.nome ?? "—"}
              {user.lider && <span className="text-gold-600">★</span>}
            </div>
            <div className="truncate text-xs text-graphite-500">{user.email}</div>
            <div className="mt-1.5 flex items-center gap-1">
              {user.role === "admin" ? (
                <Pill tone="warn">Admin</Pill>
              ) : (
                <Pill tone="neutral">Funcionário</Pill>
              )}
              {user.suspenso ? (
                <Pill tone="danger">Suspenso</Pill>
              ) : (
                <Pill tone="success">Ativo</Pill>
              )}
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              feedback.kind === "ok"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-danger-50 bg-danger-50 text-danger-700"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Papel */}
        <Section title="Papel">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-graphite-600">
              Hoje:{" "}
              <strong className="text-graphite-900">
                {user.role === "admin" ? "Admin (Suporte TI)" : "Funcionário"}
              </strong>
            </div>
            <Button
              size="sm"
              variant={user.role === "admin" ? "secondary" : "primary"}
              onClick={handleRole}
              disabled={pending || !canChangeRole}
              title={canChangeRole ? undefined : "Você não pode mudar seu próprio papel."}
            >
              {user.role === "admin" ? "Rebaixar a funcionário" : "Promover a admin"}
            </Button>
          </div>
        </Section>

        {/* Suspensão */}
        <Section title="Suspensão">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-graphite-600">
              Hoje:{" "}
              <strong className="text-graphite-900">{user.suspenso ? "Suspenso" : "Ativo"}</strong>
            </div>
            <Button
              size="sm"
              variant={user.suspenso ? "primary" : "danger"}
              onClick={handleSuspend}
              disabled={pending || !canSuspend}
              title={canSuspend ? undefined : "Apenas o líder admin pode suspender a si mesmo."}
            >
              {user.suspenso ? "Reativar conta" : "Suspender conta"}
            </Button>
          </div>
        </Section>

        {/* E-mail */}
        <Section title="Alterar e-mail">
          <form onSubmit={handleEmail} className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Novo e-mail">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Button type="submit" variant="secondary" size="md" disabled={pending}>
              Salvar
            </Button>
          </form>
        </Section>

        {/* Senha */}
        <Section title="Alterar senha">
          <form onSubmit={handlePassword} className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <Button type="submit" variant="secondary" size="md" disabled={pending}>
              Salvar
            </Button>
          </form>
        </Section>

        {/* Excluir */}
        <Section title="Excluir conta" tone="danger">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-graphite-600">
              Remove permanentemente. Não pode ser desfeito.
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDelete}
              disabled={pending || !canDelete}
              title={canDelete ? undefined : "Você não pode excluir sua própria conta."}
            >
              {confirmDelete ? "Confirmar exclusão" : "Excluir"}
            </Button>
          </div>
          {confirmDelete && (
            <div className="mt-2 text-xs text-danger-700">
              Clique de novo no botão acima para confirmar, ou{" "}
              <button type="button" className="underline" onClick={() => setConfirmDelete(false)}>
                cancelar
              </button>
              .
            </div>
          )}
        </Section>

        <div className="flex justify-end border-t border-graphite-100 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Section({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <section
      className={`rounded-md border px-3 py-3 ${
        tone === "danger"
          ? "border-danger-50 bg-danger-50/40"
          : "border-graphite-200 bg-graphite-50"
      }`}
    >
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-graphite-600">
        {title}
      </h3>
      {children}
    </section>
  );
}
