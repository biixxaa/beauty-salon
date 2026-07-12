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
  // Project-specific rule adjustments: lower severity for select rules
  {
    rules: {
      // allow `any` temporarily and surface as warnings
      '@typescript-eslint/no-explicit-any': 'warn',
      // avoid failing build for unescaped entities in JSX
      'react/no-unescaped-entities': 'off',
      // surface hook dependency and setState-in-effect issues as warnings
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // allow ts-ignore in some cases but warn
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
]);

export default eslintConfig;
