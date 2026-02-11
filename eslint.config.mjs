import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

import { rule as noPoint64Equality } from "./eslint/no-point64-equality.mjs";

// eslint-disable-next-line @typescript-eslint/no-deprecated
export default tseslint.config(
  {
    ignores: ["dist/", "node_modules/", "coverage/"],
  },

  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mjs",
            "eslint/no-point64-equality.mjs",
          ],
        },

        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "custom-rules": {
        rules: {
          "no-point64-equality": noPoint64Equality,
        },
      },
    },
  },

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "custom-rules/no-point64-equality": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },

  {
    files: ["tests/**/*.test.ts"],
    rules: {
      // allow us to use node's test runner idiomatically
      "@typescript-eslint/no-floating-promises": "off",
    },
  },

  eslintConfigPrettier,
);
