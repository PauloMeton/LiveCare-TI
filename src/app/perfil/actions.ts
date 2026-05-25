"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  UpdateProfileSchema,
  UpdatePasswordSchema,
  firstZodMessage,
} from "@/lib/schemas";

export async function updateProfile(input: { nome: string; cargo: string }) {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({
      nome: parsed.data.nome,
      cargo: parsed.data.cargo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updatePassword(newPassword: string) {
  const parsed = UpdatePasswordSchema.safeParse(newPassword);
  if (!parsed.success) return { error: firstZodMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };

  return { ok: true };
}
