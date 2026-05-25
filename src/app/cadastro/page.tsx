"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { signUp } from "./actions";

const ALLOWED_DOMAIN = "@liveacademia.com.br";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    startTransition(async () => {
      const r = await signUp({ nome, email, password });
      if (r.error) {
        setError(r.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-graphite-50">
        <div className="w-full max-w-md bg-white border border-graphite-200 rounded-xl shadow-md p-8 text-center">
          <div className="text-3xl mb-2">✓</div>
          <h1 className="text-xl font-bold text-graphite-900 mb-2">Confira seu e-mail</h1>
          <p className="text-sm text-graphite-600 mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>. Abra-o para ativar sua conta.
          </p>
          <Link href="/login" className="text-sm font-semibold text-graphite-900 hover:underline">
            Voltar para login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6 bg-graphite-50"
      style={{ backgroundImage: "radial-gradient(circle at top right, rgba(255,204,0,0.10), transparent 60%)" }}
    >
      <div className="w-full max-w-md bg-white border border-graphite-200 rounded-xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <BrandLockup size={44} />
        </div>
        <h1 className="text-2xl font-bold text-graphite-900 mb-1 text-center">Criar conta</h1>
        <p className="text-sm text-graphite-500 text-center mb-6">
          Use seu e-mail corporativo {ALLOWED_DOMAIN}.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nome completo" required>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </Field>
          <Field label="E-mail corporativo" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`seu.nome${ALLOWED_DOMAIN}`}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Senha" required hint="Mínimo de 8 caracteres.">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar senha" required>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" full size="lg" disabled={pending}>
            {pending ? "Criando…" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center text-graphite-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
