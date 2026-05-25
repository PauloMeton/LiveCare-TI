"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/lib/types";
import { BrandLockup } from "@/components/ui/BrandLockup";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { updateTicket } from "@/app/chamados/actions";

type Props = {
  ticket: Ticket;
  unidades: Array<{ id: number; nome: string }>;
};

export function EditTicketForm({ ticket, unidades }: Props) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(ticket.titulo);
  const [campos, setCampos] = useState<Record<string, string>>(ticket.campos);
  const [observacao, setObservacao] = useState(ticket.observacao ?? "");
  const [unidadeId, setUnidadeId] = useState(ticket.unidade_id?.toString() ?? "");
  const [prioridade, setPrioridade] = useState(ticket.prioridade);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChangeCampo(k: string, v: string) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await updateTicket({
        ticketId: ticket.id,
        titulo,
        campos,
        observacao,
        unidade_id: unidadeId ? Number(unidadeId) : null,
        prioridade,
      });
      if (r?.error) {
        setError(r.error);
        return;
      }
      router.push(`/chamados/${ticket.id}`);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-graphite-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-graphite-200 px-4 py-3 flex items-center gap-3">
        <Link href={`/chamados/${ticket.id}`} className="text-graphite-900 text-xl leading-none">
          ←
        </Link>
        <BrandLockup size={28} />
        <span className="ml-2 text-sm font-semibold text-graphite-700">Editar chamado</span>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="mb-4 flex items-center gap-2">
          <ClassBadge classe={ticket.classe} />
          <span className="text-xs font-mono text-graphite-500">#{ticket.id.slice(0, 8)}</span>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-4">
              <Field label="Título" required>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              </Field>

              {Object.keys(campos).length > 0 && (
                <div className="flex flex-col gap-4 pt-2 border-t border-graphite-100">
                  <h2 className="text-sm font-semibold text-graphite-900">Campos do formulário</h2>
                  {Object.entries(campos).map(([k, v]) => (
                    <Field key={k} label={k}>
                      {k.toLowerCase() === "situação" || k.toLowerCase() === "observação" ? (
                        <Textarea value={v} onChange={(e) => onChangeCampo(k, e.target.value)} />
                      ) : (
                        <Input value={v} onChange={(e) => onChangeCampo(k, e.target.value)} />
                      )}
                    </Field>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-graphite-100 flex flex-col gap-4">
                <Field label="Unidade">
                  <Select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
                    <option value="">Sem unidade</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Prioridade">
                  <Select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as Ticket["prioridade"])}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </Select>
                </Field>
                <Field label="Observação">
                  <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </Field>
              </div>
            </div>
          </Card>

          {error && (
            <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Link href={`/chamados/${ticket.id}`}>
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
