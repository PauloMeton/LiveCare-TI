import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compat layer pra reaproveitar as configs em formato antigo do Next.js
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Ignora artefatos do build e libs externas
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
      "*.config.mjs",
      "*.config.ts",
    ],
  },

  // Regras herdadas: Next.js + TypeScript + core web vitals
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Desliga regras que conflitam com Prettier (formatação fica com o Prettier)
  ...compat.extends("prettier"),

  // Overrides do LiveCare
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Permite usar `let _ = ...` como marca de variável intencionalmente ignorada
      "no-unused-vars": "off",
    },
  },
];
