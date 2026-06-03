"use client";
import { useState } from "react";
import { TicketFormShell } from "@/components/forms/TicketFormShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createTicket } from "@/app/chamados/actions";

export function FormFinanceiro() {
  const [titulo, setTitulo] = useState("");
  const [issRetido, setIssRetido] = useState("Sim");
  const [iss, setIss] = useState("");
  const [irrf, setIrrf] = useState("");
  const [csll, setCsll] = useState("");
  const [doc, setDoc] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createTicket({
      classe: "Financeiro",
      titulo: titulo || "Nota fiscal",
      observacao,
      campos: {
        "ISS retido": issRetido,
        ISS: iss,
        IRRF: irrf,
        CSLL: csll,
        "CPF/CNPJ": doc,
      },
      unidade_id: null,
      prioridade: "baixa",
    });
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <TicketFormShell
      title="Chamado financeiro"
      subtitle="Notas fiscais: ISS retido, ISS, IRRF, CSLL, CPF/CNPJ."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4">
            <Field label="Título do chamado" required>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Nota fiscal — Fornecedor X"
                required
              />
            </Field>
            <Field label="ISS retido?" required>
              <Select value={issRetido} onChange={(e) => setIssRetido(e.target.value)}>
                <option>Sim</option>
                <option>Não</option>
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="ISS">
                <Input value={iss} onChange={(e) => setIss(e.target.value)} placeholder="R$ 0,00" />
              </Field>
              <Field label="IRRF">
                <Input
                  value={irrf}
                  onChange={(e) => setIrrf(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </Field>
              <Field label="CSLL">
                <Input
                  value={csll}
                  onChange={(e) => setCsll(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </Field>
            </div>
            <Field label="CPF / CNPJ" required>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} required />
            </Field>
            <Field label="Observação">
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Vencimento, anexos, número da NF…"
              />
            </Field>
          </div>
        </Card>

        {error && (
          <div className="rounded-md border border-danger-50 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
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
