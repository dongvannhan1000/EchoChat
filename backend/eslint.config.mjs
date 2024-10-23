import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{js,mjs,cjs,ts}"],

    languageOptions: {
      globals: globals.browser,
    },

    

    plugins: {
      prettier: prettierPlugin,
    },

    rules: {
      ...prettierConfig.rules,
      "no-console": "warn", 
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2],
      "comma-dangle": ["error", "never"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "node_modules/*",
      "dist/*",
      "build/*"
    ],
  },
  
];
