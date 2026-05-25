"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { translateAuthError } from "@/lib/authErrors";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
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
        <h1 className="text-2xl font-bold text-graphite-900 mb-1 text-center">Nova senha</h1>
        <p className="text-sm text-graphite-500 text-center mb-6">Defina a senha que você vai usar para entrar.</p>

        {done ? (
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <div className="text-sm text-emerald-700 font-semibold mb-2">Senha alterada.</div>
            <div className="text-sm text-graphite-600">Redirecionando para o painel…</div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Nova senha" required hint="Mínimo de 8 caracteres.">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {error && (
              <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" full size="lg" disabled={loading}>
              {loading ? "Salvando…" : "Salvar nova senha"}
            </Button>

            <div className="mt-2 text-sm text-center text-graphite-600">
              <Link href="/login" className="hover:underline">Voltar ao login</Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
