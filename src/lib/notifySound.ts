// Beep curto via Web Audio API — sem dependencia de arquivo MP3, funciona
// em qualquer browser moderno. Respeita preferencia do user no localStorage.
//
// Por que Web Audio API e nao <audio src="...mp3">?
// - Nao precisa de asset estatico (1 round trip a menos)
// - Latencia mais previsivel (audio HTML pode ter delay no decode/buffer)
// - Volume e timbre controlados via JS sem editar audio externo

const STORAGE_KEY = "livecare-chat-sound";

let ctx: AudioContext | null = null;

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

/**
 * Toca um beep curto (~150ms). Falha silenciosa em casos que o browser
 * bloqueia (autoplay policy antes da primeira interacao do user).
 */
export function playNotifySound(): void {
  if (typeof window === "undefined") return;
  if (!isChatSoundEnabled()) return;

  try {
    // Reaproveita o AudioContext entre chamadas (browsers limitam quantos
    // contextos simultaneos sao permitidos)
    if (!ctx) {
      const Ctx =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      ctx = new Ctx();
    }
    // Resume se estiver suspenso por autoplay policy
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Dois tons curtos pra dar identidade — som "blip-blip" sutil
    // Tom 1: 880 Hz (A5), tom 2: 1320 Hz (E6) — intervalo de quinta justa
    playTone(ctx, 880, now, 0.08);
    playTone(ctx, 1320, now + 0.1, 0.08);
  } catch {
    /* ignora — browser bloqueou autoplay ou recurso indisponivel */
  }
}

function playTone(ctx: AudioContext, freq: number, startAt: number, duration: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;

  // Envelope: ataque rapido, decay exponencial — evita "click" no start/end
  const peak = 0.15; // volume baixo (15% do max) — nao assusta
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}
