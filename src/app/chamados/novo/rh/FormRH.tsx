"use client";
import { useState } from "react";
import { TicketFormShell } from "@/components/forms/TicketFormShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createTicket } from "@/app/chamados/actions";

/** Formata enquanto o usuário digita: XXX.XXX.XXX-XX */
function maskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 9);
  const d = digits.slice(9, 11);
  let out = a;
  if (b) out += `.${b}`;
  if (c) out += `.${c}`;
  if (d) out += `-${d}`;
  return out;
}

/** Só aceita se tiver 11 dígitos. */
function isValidCpfFormat(formatted: string): boolean {
  return formatted.replace(/\D/g, "").length === 11;
}

export function FormRH({ unidades }: { unidades: Array<{ id: number; nome: string }> }) {
  const [colaborador, setColaborador] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cargo, setCargo] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [tipoMovimentacao, setTipoMovimentacao] = useState("admissao");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidCpfFormat(cpf)) {
      setError("Informe um CPF com 11 dígitos.");
      return;
    }

    setLoading(true);
    const result = await createTicket({
      classe: "RH",
      titulo: `${tipoMovimentacao === "admissao" ? "Admissão" : "Demissão"} — ${colaborador}`,
      unidade_id: unidadeId ? Number(unidadeId) : null,
      observacao,
      campos: {
        Colaborador: colaborador,
        CPF: cpf,
        "Data de nascimento": dataNascimento,
        Cargo: cargo,
        Unidade: unidades.find((u) => u.id === Number(unidadeId))?.nome ?? "—",
        Tipo: tipoMovimentacao === "admissao" ? "Admissão" : "Demissão",
      },
      prioridade: "baixa"
    });
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <TicketFormShell title="Chamado de RH" subtitle="Novo colaborador, admissão ou demissão.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4">
            <Field label="Tipo" required>
              <Select value={tipoMovimentacao} onChange={(e) => setTipoMovimentacao(e.target.value)}>
                <option value="admissao">Admissão</option>
                <option value="demissao">Demissão</option>
              </Select>
            </Field>
            <Field label="Nome do colaborador" required>
              <Input value={colaborador} onChange={(e) => setColaborador(e.target.value)} required />
            </Field>
            <Field label="CPF" required hint="Apenas números — a formatação é automática.">
              <Input
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </Field>
            <Field label="Data de nascimento" required>
              <Input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
              />
            </Field>
            <Field label="Cargo" required>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} required />
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
            <Field label="Observação">
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes adicionais (opcional)"
              />
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
