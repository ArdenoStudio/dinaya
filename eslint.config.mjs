import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "apps/desktop/dist/**",
    "apps/desktop/src-tauri/target/**",
    "node_modules/**",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    // Sibling projects with their own toolchains
    "dinaya-uptime-monitor/**",
  ]),
]);
