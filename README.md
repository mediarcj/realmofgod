<!--
File: README.md
Description: Introduces the Realm of God project.
Purpose: Gives contributors a concise description of the product.
Notes: None.
-->

# Realm of God

Realm of God is a private prayer and journaling retreat.

## Local foundation

The repository begins with one isolated `@realmofgod/sanctuary` package. It combines a small React/Vite browser shell with a same-origin, Cloudflare Worker-compatible backend boundary. Marketing, authentication, database access, billing, encryption, and real prayer features are intentionally absent from this bootstrap.

Local work uses Node.js 24.19.0, pnpm 11.21.0, and synthetic data only. It does not require a hosted account or production credential.
