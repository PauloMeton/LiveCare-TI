// Helpers de tema (light / dark / system).
//
// Estrategia anti-flash:
// 1. Cookie `livecare-theme` lido no Server Component (layout root) com a preferencia salva.
// 2. <html> recebe class="dark" se preferencia for dark (ou system + media query dark).
// 3. Um <script> inline antes do React aplica o tema certo se "system" + media muda.
// 4. Toggle no client grava cookie + localStorage + atualiza class no html.

export type ThemePref = "light" | "dark" | "system";

export const THEME_COOKIE = "livecare-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

/** Normaliza string vinda de cookie/localStorage. */
export function normalizeTheme(v: string | undefined | null): ThemePref {
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

/**
 * Script inline pra ser injetado no <head> antes do React.
 * Resolve tema "system" lendo prefers-color-scheme.
 * Evita flash quando o usuario escolheu "system" e o OS esta em dark.
 */
export const THEME_INIT_SCRIPT = `
(function(){try{
  var c=document.cookie.split('; ').find(function(r){return r.indexOf('${THEME_COOKIE}=')===0});
  var pref=c?c.split('=')[1]:'system';
  var dark=pref==='dark'||(pref==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  if(dark)document.documentElement.classList.add('dark');
}catch(e){}})();
`.trim();
