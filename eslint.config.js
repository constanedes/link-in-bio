// ESLint flat config: browser ES modules with JSDoc, no framework.
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["*.js", "tools/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        location: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        matchMedia: "readonly",
        customElements: "readonly",
        HTMLElement: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLSpanElement: "readonly",
        Image: "readonly",
        URLSearchParams: "readonly",
        console: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  {
    ignores: ["node_modules/**"],
  },
];
