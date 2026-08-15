<!--
File: README.md
Description: Introduces the Realm of God project.
Purpose: Gives contributors a concise description of the product.
Notes: None.
-->

# Realm of God

Realm of God is an anonymous interactive Christian sanctuary and contemplative Scripture journey
foundation.

## Local foundation

The repository begins with one isolated `@realmofgod/sanctuary` package. It combines a small
React/Vite browser shell with a DOM-first visual rendering boundary. Accounts, prayer entry,
database access, billing, AI, and persistent spiritual state are intentionally absent.

Local work uses Node.js 24.19.0, pnpm 11.21.0, and synthetic data only. It does not require a hosted
account or production credential. The first local rendering proof uses exact-pinned Three.js and
React Three Fiber with a readable fallback for browsers that cannot initialize graphics.
