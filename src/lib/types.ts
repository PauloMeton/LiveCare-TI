export type Classe = "RH" | "Financeiro" | "Operacoes";
export type Status = "aberto" | "andamento" | "concluido" | "cancelado" | "rejeitado";
export type Prioridade = "baixa" | "media" | "alta";

export type TicketEventTipo =
  | "aberto"
  | "editado"
  | "andamento"
  | "concluido"
  | "reaberto"
  | "rejeitado"
  | "cancelado"
  | "comentario";

export type TicketEvent = {
  id: number;
  ticket_id: string;
  ator_id: string | null;
  tipo: TicketEventTipo;
  detalhes: Record<string, unknown>;
  created_at: string;
};

export type Unidade = {
  id: number;
  nome: string;
  ativa: boolean;
};

export type Profile = {
  id: string;
  nome: string | null;
  cargo: string | null;
  role: "user" | "admin";
  suspenso: boolean;
  lider: boolean;
};

export type Ticket = {
  id: string;
  autor_id: string;
  classe: Classe;
  titulo: string;
  campos: Record<string, string>;
  observacao: string | null;
  status: Status;
  prioridade: Prioridade;
  unidade_id: number | null;
  created_at: string;
  updated_at: string;
  concluido_em: string | null;
  concluido_por: string | null;
};

// Para joins
export type TicketWithAutor = Ticket & {
  autor?: { nome: string | null; cargo: string | null } | null;
  unidade?: { nome: string } | null;
};

/* ============================================================
   CHAT
   ============================================================ */

/** Tipo de anexo na mensagem (alinhado com o CHECK no banco). */
export type AttachmentType = "image" | "video";

/** Mensagem do chat (livecare_messages). */
export type Message = {
  id: number;
  conversa_id: string; // id do funcionário dono da conversa
  autor_id: string;    // quem escreveu (funcionário ou admin)
  conteudo: string;
  read_at: string | null;     // quando a outra parte leu
  deleted_at: string | null;  // soft delete
  created_at: string;
  // Anexo opcional — imagem ou vídeo
  attachment_path: string | null;        // path no bucket livecare-chat
  attachment_type: AttachmentType | null;
  attachment_size: number | null;        // bytes
  // Virtual: signed URL gerada na hora do fetch (não é coluna do DB)
  attachment_url?: string | null;
};

/** Linha retornada por livecare_list_conversas() — pra admin. */
export type ConversaListItem = {
  conversa_id: string;
  nome: string | null;
  cargo: string | null;
  last_at: string;
  last_conteudo: string;
  last_autor_id: string;
  nao_lidas: number;
};

/* ============================================================
   ANEXOS DE CHAMADOS
   ============================================================ */

/** Anexo de chamado (livecare_ticket_attachments). */
export type TicketAttachment = {
  id: number;
  ticket_id: string;
  autor_id: string;
  path: string;
  type: AttachmentType;
  size: number;
  created_at: string;
  // Virtual: signed URL gerada na hora do fetch (não é coluna do DB)
  url?: string | null;
};
