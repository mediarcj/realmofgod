/**
 * File: eslint.config.mjs
 * Description: Defines local static-analysis rules for the Realm of God workspace.
 * Purpose: Applies strict TypeScript checks and React safety rules without adding runtime code.
 * Notes: Generated output and dependency folders are excluded from analysis.
 */

// Import only the maintained lint configurations needed by this small workspace.
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

// Keep generated or local emulator output outside the human-authored source review.
const ignoredPaths = {
  ignores: [
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
    "**/.pnpm-store/**",
    "**/.vite/**",
    "**/.wrangler/**",
    "supabase/.branches/**",
    "supabase/.temp/**",
  ],
};

// Scope type-aware rules to TypeScript and resolve projects from the repository root.
const strictTypeScript = {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
};

// Keep type-aware presets on TypeScript files so JavaScript configuration stays lightweight.
const typedPresetConfigs = [
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
].map((preset) => ({
  ...preset,
  files: ["**/*.{ts,tsx}"],
}));

// Give configuration and verification scripts Node globals without leaking them into app code.
const localTooling = {
  files: ["**/*.config.{js,mjs,ts}", "scripts/**/*.mjs", "**/scripts/**/*.mjs"],
  languageOptions: {
    globals: globals.node,
  },
};

// Apply React-specific rules only to the isolated sanctuary browser source.
const sanctuaryReact = {
  files: ["apps/sanctuary/src/**/*.{ts,tsx}"],
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.flat.recommended.rules,
    ...reactRefresh.configs.vite.rules,
  },
};

// Compose the flat configuration in a clear order from broad syntax to narrow boundaries.
export default tseslint.config(
  ignoredPaths,
  eslint.configs.recommended,
  ...typedPresetConfigs,
  strictTypeScript,
  localTooling,
  sanctuaryReact,
);
