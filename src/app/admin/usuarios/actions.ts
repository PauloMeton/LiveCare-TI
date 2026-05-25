"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UuidSchema, firstZodMessage } from "@/lib/schemas";

/** Tipo retornado por listUsers. */
export type ListedUser = {
  id: string;
  nome: string | null;
  cargo: string | null;
  role: "user" | "admin";
  suspenso: boolean;
  lider: boolean;
  email: string;
  created_at: string;
};

/**
 * Traduz mensagens de erro vindas das RPCs em PT-BR.
 * As funções no banco lançam com mensagens conhecidas — aqui só fazemos casar e traduzir.
 */
function translateAdminError(msg: string | null | undefined): string {
  if (!msg) return "Algo deu errado. Tente novamente.";
  const m = msg.toLowerCase();
  if (m.includes("forbidden")) return "Apenas administradores podem fazer isso.";
  if (m.includes("cannot delete your own")) return "Você não pode excluir sua própria conta.";
  if (m.includes("cannot suspend your own")) return "Você não pode suspender a si mesmo.";
  if (m.includes("cannot change your own role")) return "Você não pode mudar seu próprio papel.";
  if (m.includes("cannot remove the last admin")) return "Não é possível remover o último admin.";
  if (m.includes("cannot suspend the last active admin"))
    return "Não é possível suspender o último admin ativo.";
  if (m.includes("invalid role")) return "Papel inválido. Use 'user' ou 'admin'.";
  if (m.includes("invalid email")) return "E-mail inválido.";
  if (m.includes("password must be at least"))
    return "A senha precisa ter pelo menos 8 caracteres.";
  return msg;
}

/* ============================================================
   LISTAR
   ============================================================ */
export async function listUsers(): Promise<
  { ok: true; users: ListedUser[] } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("livecare_list_users");
  if (error) return { ok: false, error: translateAdminError(error.message) };
  return { ok: true, users: (data ?? []) as ListedUser[] };
}

/* ============================================================
   PROMOVER / REBAIXAR
   ============================================================ */
const RoleSchema = z.object({
  userId: UuidSchema,
  role: z.enum(["user", "admin"], { errorMap: () => ({ message: "Papel inválido." }) }),
});

export async function setUserRole(input: { userId: string; role: "user" | "admin" }) {
  const parsed = RoleSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: parsed.data.userId,
    new_role: parsed.data.role,
  });
  if (error) return { error: translateAdminError(error.message) };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/* ============================================================
   ALTERAR E-MAIL
   ============================================================ */
const EmailSchema = z.object({
  userId: UuidSchema,
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .email("Formato de e-mail inválido."),
});

export async function setUserEmail(input: { userId: string; email: string }) {
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_email", {
    target_user_id: parsed.data.userId,
    new_email: parsed.data.email,
  });
  if (error) return { error: translateAdminError(error.message) };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/* ============================================================
   ALTERAR SENHA
   ============================================================ */
const PasswordSchema = z.object({
  userId: UuidSchema,
  password: z
    .string({ required_error: "Informe a senha." })
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(128, "A senha não pode passar de 128 caracteres."),
});

export async function setUserPassword(input: { userId: string; password: string }) {
  const parsed = PasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_password", {
    target_user_id: parsed.data.userId,
    new_password: parsed.data.password,
  });
  if (error) return { error: translateAdminError(error.message) };

  return { ok: true };
}

/* ============================================================
   SUSPENDER / REATIVAR
   ============================================================ */
export async function suspendUser(userId: string) {
  const parsed = UuidSchema.safeParse(userId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("livecare_set_suspenso", {
    target_user_id: parsed.data,
    suspender: true,
  });
  if (error) return { error: translateAdminError(error.message) };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function unsuspendUser(userId: string) {
  const parsed = UuidSchema.safeParse(userId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("livecare_set_suspenso", {
    target_user_id: parsed.data,
    suspender: false,
  });
  if (error) return { error: translateAdminError(error.message) };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/* ============================================================
   EXCLUIR (hard delete em auth.users — cascateia em profiles)
   ============================================================ */
export async function deleteUser(userId: string) {
  const parsed = UuidSchema.safeParse(userId);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_user", {
    target_user_id: parsed.data,
  });
  if (error) return { error: translateAdminError(error.message) };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
