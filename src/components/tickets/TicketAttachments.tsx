"use client";

import { useRef, useState, useTransition } from "react";
import type { TicketAttachment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { TICKET_ATTACHMENTS_BUCKET } from "@/lib/ticketAttachments";
import {
  addTicketAttachment,
  removeTicketAttachment,
} from "@/app/chamados/actions";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_MIME =
  "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

type Props = {
  ticketId: string;
  attachments: TicketAttachment[];
  /** Quem pode anexar/remover: autor (enquanto aberto) ou admin sempre. */
  canEdit: boolean;
  currentUserId: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function detectType(mime: string): "image" | "video" | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

export function TicketAttachments({
  ticketId,
  attachments,
  canEdit,
  currentUserId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onPickFile(file: File) {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("Arquivo passa de 25MB.");
      return;
    }
    const type = detectType(file.type);
    if (!type) {
      setError("Tipo de arquivo não suportado (use imagem ou vídeo).");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${ticketId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(TICKET_ATTACHMENTS_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (upErr) {
        setError(`Falha no upload: ${upErr.message}`);
        return;
      }

      const r = await addTicketAttachment({
        ticketId,
        path,
        type,
        size: file.size,
      });

      if (r?.error) {
        setError(r.error);
        // Tenta limpar o arquivo órfão
        await supabase.storage
          .from(TICKET_ATTACHMENTS_BUCKET)
          .remove([path])
          .catch(() => undefined);
        return;
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onRemove(att: TicketAttachment) {
    if (!confirm("Remover este anexo?")) return;
    setError(null);
    startTransition(async () => {
      const r = await removeTicketAttachment(att.id);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-graphite-900">
          Anexos {attachments.length > 0 && `(${attachments.length})`}
        </h2>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || pending}
            >
              {uploading ? "Enviando…" : "+ Anexar"}
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="text-sm text-danger-700 bg-danger-50 border border-danger-50 rounded-md px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-sm text-graphite-500">
          {canEdit
            ? "Nenhum anexo. Use o botão acima pra adicionar imagens ou vídeos (até 25MB)."
            : "Nenhum anexo neste chamado."}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => {
            const canRemove = canEdit && att.autor_id === currentUserId;
            return (
              <li
                key={att.id}
                className="bg-graphite-50 border border-graphite-100 rounded-md overflow-hidden"
              >
                {att.url ? (
                  att.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={att.url}
                        alt="Anexo"
                        className="w-full h-40 object-cover"
                      />
                    </a>
                  ) : (
                    <video
                      src={att.url}
                      controls
                      className="w-full h-40 object-cover bg-black"
                    />
                  )
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-graphite-400 text-sm">
                    (anexo indisponível)
                  </div>
                )}
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-graphite-500 uppercase tracking-wide">
                      {att.type === "image" ? "Imagem" : "Vídeo"} · {formatBytes(att.size)}
                    </div>
                    <div className="text-xs text-graphite-700 truncate">
                      {new Date(att.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(att)}
                      disabled={pending}
                      className="text-xs text-danger-700 hover:underline disabled:opacity-50 flex-shrink-0"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
