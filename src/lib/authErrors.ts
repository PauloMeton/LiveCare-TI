// Tradução de erros comuns do Supabase Auth para PT-BR.
// Recebe a mensagem original (em inglês) e retorna texto amigável.

const dictionary: Array<[RegExp | string, string]> = [
  ["Invalid login credentials", "E-mail ou senha incorretos."],
  ["Email not confirmed", "Confirme o e-mail enviado antes de entrar."],
  ["User already registered", "Já existe uma conta com esse e-mail."],
  ["User not found", "Conta não encontrada."],
  ["For security purposes, you can only request this after", "Aguarde alguns instantes antes de tentar de novo."],
  [/Password should be at least \d+ characters/i, "A senha precisa ter pelo menos 8 caracteres."],
  ["Password should contain at least one character of each", "A senha precisa ter letras, números e um símbolo."],
  [/email rate limit exceeded/i, "Muitos pedidos. Aguarde alguns minutos."],
  [/over_request_rate_limit/i, "Muitos pedidos. Aguarde alguns minutos."],
  [/signups not allowed/i, "Cadastros estão temporariamente desativados."],
  ["Token has expired or is invalid", "Este link expirou. Solicite um novo."],
  ["Anonymous sign-ins are disabled", "Cadastros anônimos estão desativados."],
  ["Unable to validate email address: invalid format", "Formato de e-mail inválido."],
  ["New password should be different from the old password", "Use uma senha diferente da anterior."],
];

/** Traduz a mensagem do erro do Supabase Auth pra PT-BR. */
export function translateAuthError(message: string | null | undefined): string {
  if (!message) return "Algo deu errado. Tente novamente.";
  for (const [pattern, translation] of dictionary) {
    if (typeof pattern === "string") {
      if (message.toLowerCase().includes(pattern.toLowerCase())) return translation;
    } else if (pattern.test(message)) {
      return translation;
    }
  }
  return message; // fallback: mostra a original
}
