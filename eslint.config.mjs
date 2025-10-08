import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**", // Ignore generated Prisma files
      "**/*.wasm.js", // Ignore WebAssembly files
      "test-*.html", // Ignore test HTML files
      "**/test-*", // Ignore test directories and files
      "**/debug-*", // Ignore debug files
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Disable problematic rules for third-party code
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  {
    // Special rules for generated/vendor files
    files: ["src/generated/**/*.js", "**/*.wasm.js", "**/node_modules/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
