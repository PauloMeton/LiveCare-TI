"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { translateAuthError } from "@/lib/authErrors";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pega mensagem de erro vinda do callback (link de e-mail inválido/expirado)
  useEffect(() => {
    const errFromQuery = params.get("erro");
    if (errFromQuery) setError(errFromQuery);
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(translateAuthError(error.message));
      return;
    }

    // Cheque rápido: se o profile está suspenso, desloga imediatamente
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("suspenso")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.suspenso) {
        await supabase.auth.signOut();
        setLoading(false);
        setError("Sua conta foi suspensa. Fale com o suporte TI.");
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
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
        <h1 className="text-2xl font-bold text-graphite-900 mb-1 text-center">Bem-vindo de volta</h1>
        <p className="text-sm text-graphite-500 text-center mb-6">Entre com sua conta Live Academia.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="E-mail" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Senha" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          {error && (
            <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" full size="lg" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center text-graphite-600">
          <Link href="/recuperar-senha" className="hover:underline">Esqueci minha senha</Link>
          <span className="mx-2 text-graphite-300">·</span>
          <Link href="/cadastro" className="hover:underline">Criar conta</Link>
        </div>
      </div>
    </main>
  );
}
