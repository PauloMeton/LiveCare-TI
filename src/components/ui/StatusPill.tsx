import { Status } from "@/lib/types";
import { Pill } from "./Pill";

const labels: Record<Status, string> = {
  aberto:    "Aberto",
  andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  rejeitado: "Rejeitado",
};

const tones: Record<Status, "warn" | "info" | "success" | "neutral" | "danger"> = {
  aberto:    "warn",
  andamento: "info",
  concluido: "success",
  cancelado: "neutral",
  rejeitado: "danger",
};

export function StatusPill({ status }: { status: Status }) {
  return <Pill tone={tones[status]}>{labels[status]}</Pill>;
}
