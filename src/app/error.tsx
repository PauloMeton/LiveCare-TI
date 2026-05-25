"use client";

// Captura erros não tratados em qualquer rota.
// Substitui a tela default do Next por algo legível para o usuário final.

import { useEffect } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção, aqui entraria a chamada pro Sentry/Vercel Analytics.
    // Por enquanto, só log no console.
    console.error("[LiveCare] erro não tratado:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-graphite-50">
      <div className="w-full max-w-md bg-white border border-graphite-200 rounded-xl shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLockup size={44} />
        </div>

        <div className="text-5xl mb-3" aria-hidden>
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-graphite-900 mb-2">Algo deu errado</h1>
        <p className="text-sm text-graphite-600 mb-2">
          Encontramos um problema ao carregar esta tela. A equipe de suporte já pode ser avisada.
        </p>

        {error.digest && (
          <p className="text-[11px] font-mono text-graphite-400 mb-6">
            Código: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => reset()}>Tentar novamente</Button>
          <Link href="/dashboard">
            <Button variant="secondary" full>Ir para o painel</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
