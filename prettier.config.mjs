/**
 * File: prettier.config.mjs
 * Description: Defines deterministic formatting for human-authored project files.
 * Purpose: Keeps code and configuration readable without style-only review noise.
 * Notes: Generated lockfiles are excluded from formatting checks.
 */

// Keep formatting conservative and compatible with the repository's two-space convention.
const config = {
  bracketSpacing: true,
  endOfLine: "lf",
  printWidth: 100,
  proseWrap: "always",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
};

export default config;
