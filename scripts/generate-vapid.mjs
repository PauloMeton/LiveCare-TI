// Gera o par de chaves VAPID (Web Push) — roda 1 vez na vida do projeto.
//
// Uso:
//   node scripts/generate-vapid.mjs
//
// Output: 2 chaves (publica + privada). Voce salva nas env vars do projeto:
//   - NEXT_PUBLIC_VAPID_PUBLIC_KEY (Vercel, accessivel ao client pra subscribe)
//   - VAPID_PRIVATE_KEY (Edge Function secret, NUNCA expor ao client)
//   - VAPID_SUBJECT (string `mailto:seu-email@exemplo.com`)

import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

// Converte a chave publica DER pra "raw" 65 bytes (formato esperado pelo Web Push API)
// Os 26 primeiros bytes do SPKI DER sao o header do algoritmo; o resto eh a chave raw
const rawPublic = publicKey.subarray(publicKey.length - 65);
// Pra privada, extrai os 32 bytes apos o header PKCS8
const rawPrivate = privateKey.subarray(36, 36 + 32);

const b64url = (b) =>
  b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pub = b64url(rawPublic);
const priv = b64url(rawPrivate);

console.log("\n✅ VAPID keys geradas\n");
console.log("━".repeat(70));
console.log("\nNEXT_PUBLIC_VAPID_PUBLIC_KEY:");
console.log(pub);
console.log("\nVAPID_PRIVATE_KEY:");
console.log(priv);
console.log("\n" + "━".repeat(70));
console.log("\nProximos passos:\n");
console.log("1. Vercel → Project Settings → Environment Variables:");
console.log("   - NEXT_PUBLIC_VAPID_PUBLIC_KEY = (publica acima)\n");
console.log("2. Supabase → Edge Functions → livecare-send-push → Secrets:");
console.log("   - VAPID_PUBLIC_KEY = (publica acima)");
console.log("   - VAPID_PRIVATE_KEY = (privada acima)");
console.log("   - VAPID_SUBJECT = mailto:paulo.meton@liveacademia.com.br\n");
console.log("3. Redeploy na Vercel pra usar a env var no client.\n");
