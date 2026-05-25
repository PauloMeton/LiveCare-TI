import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function NovoChamadoPage() {
  await getCurrentUser();
  const supabase = await createClient();
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome");

  const _ = unidades; // unidades são consumidas nos formulários por classe

  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-graphite-900 text-xl">←</Link>
        <BrandLockup size={28} />
        <span className="ml-2 text-sm font-semibold text-graphite-700">Novo chamado</span>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-graphite-900 mb-1">Qual o tipo do chamado?</h1>
        <p className="text-sm text-graphite-500 mb-5">Escolha a classe que melhor descreve o pedido.</p>

        <div className="grid gap-3">
          <Link href="/chamados/novo/rh">
            <Card className="hover:border-graphite-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center font-bold">RH</div>
                <div>
                  <div className="font-semibold text-graphite-900">Recursos Humanos</div>
                  <div className="text-xs text-graphite-500">Novo colaborador, admissão, demissão.</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/chamados/novo/financeiro">
            <Card className="hover:border-graphite-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-graphite-100 text-graphite-800 flex items-center justify-center font-bold">$</div>
                <div>
                  <div className="font-semibold text-graphite-900">Financeiro</div>
                  <div className="text-xs text-graphite-500">Notas fiscais — ISS, IRRF, CSLL, CPF/CNPJ.</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/chamados/novo/operacoes">
            <Card className="hover:border-graphite-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center font-bold">OP</div>
                <div>
                  <div className="font-semibold text-graphite-900">Operações</div>
                  <div className="text-xs text-graphite-500">Equipamento, infraestrutura, situação na unidade.</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
