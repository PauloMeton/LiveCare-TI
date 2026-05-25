// Schemas Zod usados nas Server Actions.
// Mensagens em português pra serem renderizadas direto no UI.

import { z } from "zod";

export const ClasseSchema = z.enum(["RH", "Financeiro", "Operacoes"], {
  errorMap: () => ({ message: "Classe inválida." }),
});

export const StatusSchema = z.enum([
  "aberto",
  "andamento",
  "concluido",
  "cancelado",
  "rejeitado",
]);
export const PrioridadeSchema = z.enum(["baixa", "media", "alta"]);

export const UuidSchema = z.string().uuid("Identificador inválido.");

/** Aceita string ou null/undefined; trim e converte string vazia em null. */
const OptionalTrimmedString = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null(), z.undefined()])
    .transform((v) => (v == null || v === "" ? null : v));

/** Input de criação de chamado. */
export const CreateTicketSchema = z.object({
  classe: ClasseSchema,
  titulo: z
    .string({ required_error: "Informe um título." })
    .trim()
    .min(3, "Título precisa ter pelo menos 3 caracteres.")
    .max(200, "Título não pode passar de 200 caracteres."),
  campos: z
    .record(z.string(), z.string().max(2000, "Campo muito longo."))
    .refine((r) => Object.keys(r).length > 0, "Informe ao menos um campo."),
  observacao: OptionalTrimmedString(2000),
  unidade_id: z
    .union([z.number().int().positive(), z.null(), z.undefined()])
    .transform((v) => (v == null ? null : v)),
  prioridade: PrioridadeSchema.optional().default("media"),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

/** Atualização do perfil próprio. */
export const UpdateProfileSchema = z.object({
  nome: z
    .string({ required_error: "Informe o nome." })
    .trim()
    .min(2, "Nome precisa ter pelo menos 2 caracteres.")
    .max(120, "Nome não pode passar de 120 caracteres."),
  cargo: OptionalTrimmedString(120),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/** Alteração de senha do próprio usuário. */
export const UpdatePasswordSchema = z
  .string({ required_error: "Informe a nova senha." })
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(128, "A senha não pode passar de 128 caracteres.");

/** Edição de chamado pelo próprio autor (apenas enquanto aberto). */
export const UpdateTicketSchema = z.object({
  ticketId: UuidSchema,
  titulo: z.string().trim().min(3, "Título precisa ter pelo menos 3 caracteres.").max(200),
  campos: z.record(z.string(), z.string().max(2000)),
  observacao: OptionalTrimmedString(2000),
  unidade_id: z
    .union([z.number().int().positive(), z.null(), z.undefined()])
    .transform((v) => (v == null ? null : v)),
  prioridade: PrioridadeSchema.optional().default("media"),
});
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

/** Rejeição pelo admin (exige motivo). */
export const RejectTicketSchema = z.object({
  ticketId: UuidSchema,
  motivo: z
    .string({ required_error: "Informe o motivo da rejeição." })
    .trim()
    .min(5, "Motivo precisa ter pelo menos 5 caracteres.")
    .max(500, "Motivo não pode passar de 500 caracteres."),
});
export type RejectTicketInput = z.infer<typeof RejectTicketSchema>;

/** Cadastro de nova conta — restrito ao domínio @liveacademia.com.br. */
export const SignUpSchema = z.object({
  nome: z
    .string({ required_error: "Informe o nome." })
    .trim()
    .min(2, "Nome precisa ter pelo menos 2 caracteres.")
    .max(120, "Nome não pode passar de 120 caracteres."),
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .email("Formato de e-mail inválido.")
    .refine(
      (v) => v.endsWith("@liveacademia.com.br"),
      "O e-mail precisa ser do domínio @liveacademia.com.br."
    ),
  password: z
    .string({ required_error: "Informe a senha." })
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(128, "A senha não pode passar de 128 caracteres."),
});
export type SignUpInput = z.infer<typeof SignUpSchema>;

/* ============================================================
   CHAT
   ============================================================ */

/** Envio de mensagem no chat. */
export const SendMessageSchema = z.object({
  conversaId: UuidSchema,
  conteudo: z
    .string({ required_error: "Mensagem vazia." })
    .trim()
    .min(1, "Mensagem vazia.")
    .max(4000, "Mensagem muito longa (máx 4000 caracteres)."),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

/** ID numérico de mensagem (PK da tabela). */
export const MessageIdSchema = z
  .number({ required_error: "Identificador inválido." })
  .int()
  .positive();

/** Helper: converte ZodError em string única pra UI. */
export function firstZodMessage(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Dados inválidos.";
}
