import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Local storage restoration and request-driven state updates are deliberate
      // synchronization effects in this client application.
      "react-hooks/set-state-in-effect": "off",
      // These modules are not React components, so Next router hooks cannot be used.
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
]);

export default eslintConfig;
