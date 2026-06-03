// Gera os icones do PWA a partir de public/icons/source.png.
//
// Uso:
//   node scripts/generate-icons.mjs
//
// Requer:
//   npm install --save-dev sharp
//
// Saidas em public/icons/:
//   - icon-192.png             (Android home, leve)
//   - icon-512.png             (splash + grandes)
//   - icon-maskable-512.png    (Android adaptive — com padding seguro)
//   - apple-touch-icon.png     (iOS home, 180x180)
//   - favicon.png              (32x32, favicon do browser)

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, "public", "icons");
const SOURCE = path.join(ICONS_DIR, "source.png");

if (!existsSync(SOURCE)) {
  console.error(`❌ Arquivo não encontrado: ${SOURCE}`);
  console.error(
    "   Salva a imagem em public/icons/source.png (idealmente 1024x1024 ou maior, PNG quadrada)."
  );
  process.exit(1);
}

await mkdir(ICONS_DIR, { recursive: true });

const tasks = [
  { out: "icon-192.png", size: 192, padding: 0 },
  { out: "icon-512.png", size: 512, padding: 0 },
  // Maskable precisa de "safe zone" — Android corta as bordas em mascaras
  // adaptativas (circulo, squircle, etc). Reduzimos pra 80% e centramos com
  // fundo da cor de tema pra que mesmo cortado o conteudo fique visivel.
  { out: "icon-maskable-512.png", size: 512, padding: 0.1, bg: { r: 10, g: 10, b: 9, alpha: 1 } },
  { out: "apple-touch-icon.png", size: 180, padding: 0 },
  { out: "favicon.png", size: 32, padding: 0 },
];

for (const t of tasks) {
  const outPath = path.join(ICONS_DIR, t.out);

  if (t.padding > 0 && t.bg) {
    // Maskable: reduz o conteudo pra 80% e adiciona fundo preto nas bordas
    const innerSize = Math.round(t.size * (1 - t.padding * 2));
    const offset = Math.round((t.size - innerSize) / 2);

    const inner = await sharp(SOURCE).resize(innerSize, innerSize).png().toBuffer();

    await sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: t.bg,
      },
    })
      .composite([{ input: inner, top: offset, left: offset }])
      .png()
      .toFile(outPath);
  } else {
    await sharp(SOURCE).resize(t.size, t.size).png().toFile(outPath);
  }

  console.log(`✓ ${t.out} (${t.size}x${t.size})`);
}

console.log("\n✅ Pronto! Ícones em public/icons/");
console.log(
  "Próximo passo: garantir que `sharp` está em devDependencies e o manifest aponta corretamente."
);
