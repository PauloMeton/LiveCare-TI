"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { translateAuthError } from "@/lib/authErrors";

export default function RecuperarSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/redefinir-senha`
          : undefined,
    });
    setLoading(false);
    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    setDone(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-graphite-50">
      <div className="w-full max-w-md bg-white border border-graphite-200 rounded-xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <BrandLockup size={44} />
        </div>
        <h1 className="text-2xl font-bold text-graphite-900 mb-1 text-center">Recuperar senha</h1>
        <p className="text-sm text-graphite-500 text-center mb-6">
          Vamos te enviar um link para criar uma nova senha.
        </p>

        {done ? (
          <div className="text-sm text-graphite-700 text-center">
            Se houver uma conta com esse e-mail, o link foi enviado.
            <div className="mt-6">
              <Link href="/login" className="font-semibold hover:underline">Voltar ao login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="E-mail" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            {error && (
              <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <Button type="submit" full size="lg" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link"}
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
