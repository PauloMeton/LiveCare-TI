import Link from "next/link";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-6 bg-graphite-50"
      style={{ backgroundImage: "radial-gradient(circle at top right, rgba(255,204,0,0.10), transparent 60%)" }}
    >
      <div className="w-full max-w-md bg-white border border-graphite-200 rounded-xl shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLockup size={44} />
        </div>

        <div className="text-7xl font-bold text-gold-400 mb-2 leading-none">404</div>
        <h1 className="text-xl font-bold text-graphite-900 mb-2">Página não encontrada</h1>
        <p className="text-sm text-graphite-600 mb-6">
          O endereço que você tentou abrir não existe ou foi movido.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/dashboard">
            <Button full>Ir para o painel</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" full>Voltar ao login</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
