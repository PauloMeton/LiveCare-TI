// Pagina exibida quando o usuario tenta navegar offline e nao tem versao
// daquela rota em cache. Pre-cacheada pelo service worker no install.

import { BrandLockup } from "@/components/ui/BrandLockup";

export const metadata = {
  title: "Sem conexão · LiveCare TI",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-graphite-50 p-6 text-center">
      <BrandLockup size={48} />

      <h1 className="mt-6 text-2xl font-bold text-graphite-900">Sem conexão</h1>
      <p className="mt-2 max-w-sm text-sm text-graphite-600">
        Você está offline. As páginas que você já abriu antes continuam disponíveis. Pra atualizar
        dados e criar chamados novos, reconecte à internet.
      </p>

      <a
        href="/dashboard"
        className="mt-6 inline-block rounded-md bg-graphite-900 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Tentar de novo
      </a>

      <p className="mt-8 text-[11px] text-graphite-400">
        Quando você reconectar, o app sincroniza sozinho.
      </p>
    </div>
  );
}
