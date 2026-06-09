// Beep curto via Web Audio API — sem dependencia de arquivo MP3, funciona
// em qualquer browser moderno. Respeita preferencia do user no localStorage.
//
// Por que Web Audio API e nao <audio src="...mp3">?
// - Nao precisa de asset estatico (1 round trip a menos)
// - Latencia mais previsivel (audio HTML pode ter delay no decode/buffer)
// - Volume e timbre controlados via JS sem editar audio externo
//
// IMPORTANTE — Autoplay policy: Chrome/Firefox/Safari bloqueiam
// AudioContext ate o user fazer alguma interacao (click/key/touch).
// initNotifySound() registra listeners de "primeira interacao" que
// destravam o contexto preventivamente. Sem isso, o primeiro beep
// nunca toca, ate o user clicar/teclar em algum lugar.

const STORAGE_KEY = "livecare-chat-sound";

let ctx: AudioContext | null = null;
let unlockHandlersInstalled = false;

/** True se o user nao silenciou (default true). */
export function isChatSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setChatSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* private mode / quota — ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * Instala listeners "once" de interacao do user (click/key/touch) que
 * destravam o AudioContext na primeira oportunidade. Idempotente —
 * pode ser chamado quantas vezes quiser.
 *
 * Chame uma vez no componente raiz (layout client) pra garantir que
 * o som funciona a partir da primeira interacao do user na pagina.
 */
export function initNotifySound(): void {
  if (typeof window === "undefined") return;
  if (unlockHandlersInstalled) return;
  unlockHandlersInstalled = true;

  const unlock = async () => {
    const c = getCtx();
    if (!c) return;
    if (c.state === "suspended") {
      try {
        await c.resume();
      } catch {
        /* ignora */
      }
    }
  };

  // { once: true } garante que cada listener so dispara uma vez.
  // Usamos os 3 eventos pra cobrir mouse, teclado e touch.
  document.addEventListener("click", unlock, { once: true, passive: true });
  document.addEventListener("keydown", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true, passive: true });
}

/**
 * Toca um beep curto (~200ms). Falha silenciosa se o browser bloquear
 * (autoplay policy) ou se o recurso de audio nao estiver disponivel.
 *
 * Async: aguarda resume() do contexto pra garantir que o som realmente
 * toca (versao sync anterior nao esperava e perdia o primeiro beep).
 */
export async function playNotifySound(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isChatSoundEnabled()) return;

  const c = getCtx();
  if (!c) return;

  // Tenta destravar se necessario. Se nao tem interacao previa do user,
  // resume() vai rejeitar e a gente cai fora silenciosamente.
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      return;
    }
    if (c.state !== "running") return;
  }

  try {
    const now = c.currentTime;
    // Dois tons curtos pra dar identidade — "blip-blip" sutil
    // Tom 1: 880 Hz (A5), tom 2: 1320 Hz (E6) — intervalo de quinta justa
    playTone(c, 880, now, 0.08);
    playTone(c, 1320, now + 0.1, 0.08);
  } catch {
    /* recurso indisponivel */
  }
}

function playTone(c: AudioContext, freq: number, startAt: number, duration: number): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;

  // Envelope: ataque rapido, decay exponencial — evita "click" no start/end
  const peak = 0.15; // volume baixo (15% do max) — nao assusta
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}
