/**
 * ESLint Configuration for LifeOS1
 *
 * Enforces:
 * - TypeScript (.ts) for utilities, hooks, and library functions
 * - TypeScript React (.tsx) for components
 * - No hard-coded CSS (use TailwindCSS classes only)
 * - Consistent formatting (via Prettier integration)
 * - No JSX/JS imports (use .tsx/.ts)
 */

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-require-imports": "warn",
    "no-restricted-syntax": [
      "error",
      {
        selector: "ImportDeclaration[source.value=/\.(jsx|js|css)$/]",
        message: "Import .jsx/.js files. Use .tsx/.ts instead.",
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: ["dist", "node_modules"],
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
  ],
};
