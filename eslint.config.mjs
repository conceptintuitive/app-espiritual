// eslint-config-next 16 já exporta flat config nativa — o FlatCompat
// (@eslint/eslintrc) que estava aqui quebrava com "Converting circular
// structure to JSON" ao tentar validar a config do plugin react.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Copy em PT-BR usa aspas "assim" direto no JSX o tempo todo; a regra é
      // só estilística (o React renderiza certo) e geraria dezenas de &quot;.
      "react/no-unescaped-entities": "off",
      // Regra nova do react-hooks v7 (pensada pro React Compiler). O código
      // existente usa o padrão legítimo "ler localStorage/URL no useEffect e
      // setar state" pra evitar mismatch de hidratação. Fica como aviso pra
      // código novo evitar, sem bloquear o lint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
