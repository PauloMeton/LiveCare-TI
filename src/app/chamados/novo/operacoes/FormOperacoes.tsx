"use client";
import { useState } from "react";
import { TicketFormShell } from "@/components/forms/TicketFormShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createTicket } from "@/app/chamados/actions";

export function FormOperacoes({ unidades }: { unidades: Array<{ id: number; nome: string }> }) {
  const [funcionario, setFuncionario] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [situacao, setSituacao] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const unidadeNome = unidades.find((u) => u.id === Number(unidadeId))?.nome ?? "—";
    const titulo = situacao.length > 60 ? `${situacao.slice(0, 57)}…` : situacao;

    const result = await createTicket({
      classe: "Operacoes",
      titulo: titulo || `Ocorrência — ${unidadeNome}`,
      unidade_id: unidadeId ? Number(unidadeId) : null,
      prioridade,
      observacao,
      campos: {
        Funcionário: funcionario,
        Unidade: unidadeNome,
        Situação: situacao,
      },
    });
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <TicketFormShell
      title="Chamado de operações"
      subtitle="Equipamentos, infraestrutura ou situação na unidade."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4">
            <Field label="Funcionário envolvido" required>
              <Input value={funcionario} onChange={(e) => setFuncionario(e.target.value)} required />
            </Field>
            <Field label="Unidade" required>
              <Select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} required>
                <option value="">Selecione…</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Situação" required hint="Descreva o problema com o máximo de detalhe.">
              <Textarea
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                rows={5}
                required
              />
            </Field>
            <Field label="Prioridade">
              <Select value={prioridade} onChange={(e) => setPrioridade(e.target.value as typeof prioridade)}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </Field>
            <Field label="Observação">
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </Field>
          </div>
        </Card>

        {error && (
          <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={() => history.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Abrir chamado"}
          </Button>
        </div>
      </form>
    </TicketFormShell>
  );
}
