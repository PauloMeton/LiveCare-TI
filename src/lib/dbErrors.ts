// Sanitizador de erros do Postgres/Supabase pra exibir na UI.
//
// Por que existe: `error.message` do supabase-js vaza detalhes tecnicos
// ("new row violates row-level security policy for table livecare_tickets",
// nomes de funcoes internas, etc) que nao tem valor pro usuario final
// e indicam topologia do banco.
//
// Em DEV: mostra a mensagem original (util pra debugar).
// Em PROD: mostra mensagem amigavel + traduz codigos conhecidos.

type DbError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

// Codigos SQLSTATE mais comuns que valem traducao especifica.
const CODE_MESSAGES: Record<string, string> = {
  "23505": "Esse registro já existe.",
  "23503": "Referência inválida (item relacionado não existe).",
  "23502": "Campo obrigatório não foi informado.",
  "23514": "Valor não permitido pelo formato esperado.",
  "42501": "Você não tem permissão pra essa ação.",
  P0001: "Operação não permitida nesse estado.",
};

/**
 * Converte qualquer erro do Postgres/Supabase em uma string amigavel pro
 * usuario final. Filtra ruido tecnico em producao.
 */
export function userFacingDbError(
  err: DbError | { error?: DbError } | null | undefined,
  fallback = "Não foi possível concluir. Tente novamente."
): string {
  if (!err) return fallback;
  const e: DbError = "error" in err && err.error ? err.error : (err as DbError);

  // Codigo conhecido vence
  if (e.code && CODE_MESSAGES[e.code]) return CODE_MESSAGES[e.code];

  const msg = (e.message ?? "").toLowerCase();

  // RLS leak — comum em todas as operacoes negadas
  if (msg.includes("row-level security") || msg.includes("violates row-level")) {
    return "Você não tem permissão pra essa ação.";
  }
  // Constraint check
  if (msg.includes("violates check constraint")) {
    return "Valor não permitido pra esse campo.";
  }
  // Foreign key
  if (msg.includes("violates foreign key constraint")) {
    return "Referência inválida (item relacionado não existe).";
  }
  // Unique
  if (msg.includes("duplicate key") || msg.includes("violates unique")) {
    return "Esse registro já existe.";
  }

  // Em dev, devolve o original pra ajudar debug.
  // Em prod, generica.
  if (process.env.NODE_ENV !== "production" && e.message) {
    return e.message;
  }
  return fallback;
}
