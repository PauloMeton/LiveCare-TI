"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { updateProfile, updatePassword } from "@/app/perfil/actions";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { ThemePref } from "@/lib/theme";

type Props = {
  profile: Profile;
  email: string;
  initialTheme: ThemePref;
};

export function PerfilForm({ profile, email, initialTheme }: Props) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-graphite-900 text-xl leading-none">←</Link>
        <BrandLockup size={28} />
        <span className="ml-2 text-sm font-semibold text-graphite-700">Meu perfil</span>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4">
        {/* Card de identidade */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name={profile.nome ?? "?"} size={72} color="var(--gold-100, #fff3b0)" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-graphite-900 truncate">{profile.nome ?? "—"}</div>
              <div className="text-sm text-graphite-500 truncate">{email}</div>
              <div className="mt-2">
                {isAdmin ? (
                  <Pill tone="warn">Suporte TI · Admin</Pill>
                ) : (
                  <Pill tone="neutral">Funcionário</Pill>
                )}
              </div>
            </div>
          </div>
        </Card>

        <DadosForm profile={profile} email={email} onSaved={() => router.refresh()} />
        <SenhaForm />

        {/* Tema */}
        <Card>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-graphite-900">Tema</h2>
              <p className="text-xs text-graphite-500 mt-1">
                Claro, escuro ou seguir a preferência do sistema.
              </p>
            </div>
            <ThemeToggle initial={initialTheme} />
          </div>
        </Card>

        {/* Sair */}
        <Card>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-graphite-900">Encerrar sessão</h2>
              <p className="text-xs text-graphite-500 mt-1">
                Você será desconectado(a) e levado(a) para a tela de login.
              </p>
            </div>
            <form action="/logout" method="POST">
              <Button variant="danger" type="submit" icon={<span aria-hidden>↩</span>}>
                Sair
              </Button>
            </form>
          </div>
        </Card>
      </main>

      {!isAdmin && <MobileBottomNav active="perfil" />}
    </div>
  );
}

function DadosForm({
  profile,
  email,
  onSaved,
}: {
  profile: Profile;
  email: string;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(profile.nome ?? "");
  const [cargo, setCargo] = useState(profile.cargo ?? "");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const r = await updateProfile({ nome, cargo });
      if (r.error) {
        setFeedback({ kind: "err", msg: r.error });
        return;
      }
      setFeedback({ kind: "ok", msg: "Dados atualizados." });
      onSaved();
    });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-graphite-900 mb-3">Dados pessoais</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome" required>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>
        <Field label="Cargo" hint="Opcional — ajuda o suporte a te identificar.">
          <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
        </Field>
        <Field label="E-mail" hint="O e-mail não pode ser alterado.">
          <Input value={email} disabled />
        </Field>

        {feedback && (
          <div
            className={`text-sm rounded-md px-3 py-2 border ${
              feedback.kind === "ok"
                ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                : "text-danger-700 bg-danger-50 border-danger-50"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SenhaForm() {
  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (senha.length < 8) {
      setFeedback({ kind: "err", msg: "A senha precisa ter pelo menos 8 caracteres." });
      return;
    }
    if (senha !== confirm) {
      setFeedback({ kind: "err", msg: "As senhas não conferem." });
      return;
    }

    startTransition(async () => {
      const r = await updatePassword(senha);
      if (r.error) {
        setFeedback({ kind: "err", msg: r.error });
        return;
      }
      setFeedback({ kind: "ok", msg: "Senha alterada com sucesso." });
      setSenha("");
      setConfirm("");
    });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-graphite-900 mb-3">Alterar senha</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nova senha" required hint="Mínimo de 8 caracteres.">
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar nova senha" required>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>

        {feedback && (
          <div
            className={`text-sm rounded-md px-3 py-2 border ${
              feedback.kind === "ok"
                ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                : "text-danger-700 bg-danger-50 border-danger-50"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Salvando…" : "Alterar senha"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
