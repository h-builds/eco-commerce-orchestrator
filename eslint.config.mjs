import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Next.js build output
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vercel / Cloudflare build artifacts — minified bundles, Wasm shims
    ".vercel/**",
    // Go microservice directory — wasm_exec.js & index.js are generated, not source
    "services/pricing/**",
  ]),
]);

export default eslintConfig;
