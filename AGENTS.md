<!--
File: AGENTS.md
Description: Records the enduring Sanctuary V2 implementation contract.
Purpose: Keeps the browser sanctuary aligned with its accepted visual source and product boundaries.
Notes: The contract applies to every Sanctuary V2 change.
-->

# Sanctuary V2 build rules

## Visual source and assets

- The accepted visual and spatial authority is `Realm_of_God_NEW_SANCTUARY_v2_ATMOSPHERE_LIGHTING_SURFACE_RUNTIME_FOUNDATION_v26_1_0_TECH_REVIEW.blend`.
- Verify its SHA-256 is `fc0357a2335e3ed7205a4035d2baf2bedae5ac8e5b7934dd24382d19b89a1c24` before every export.
- Never modify, save over, simplify, or export into the accepted Blender master. Browser assets are separate derivatives only.
- Do not use the rejected v26.2.0 visible-effects experiment as visual or geometry source.
- Do not reuse historical browser-room geometry or placeholders. Historical branches may be inspected for non-visual utilities and lessons only.

## Application architecture

- Production uses the Next.js App Router with React, TypeScript, Three.js, and React Three Fiber. Do not use Vite for the production application.
- Keep browser-only rendering behind client components. Use dependencies sparingly and prefer clear local code for sanctuary-specific behavior.
- Blender owns static geometry, transforms, materials, semantic names, and anchors. The browser owns rendering, interaction, camera behavior, responsive presentation, and living effects.
- Inspect the Blender scene with reusable `bpy` tooling. Export inventories must retain discovered object names, hierarchy, transforms, materials, `rog_*` metadata, anchors, and export policy.
- Keep source/master derivatives distinct from optimized web derivatives. Measure before optimization and protect defining silhouettes, proportions, contact points, altar detail, and Bible detail.

## Sanctuary construction

- Build incrementally: web foundation, floor, walls and openings, windows, clerestory and structural detail, trim, altar, devotional objects, anchors, runtime effects, responsive behavior, performance, accessibility, and polish.
- The floor is the first physical sanctuary object. Export and verify it independently before introducing later architecture.
- Use discovered runtime anchors rather than guessed coordinates. Current expected categories include Bible and prayer anchors, sunlight and dust anchors, plus candle flame, smoke, and light anchors.
- Implement candle flame, candle-light flicker, smoke, dust, sunlight shafts, and atmospheric haze at runtime. Keep them subtle and avoid obvious proxy geometry, heavy particles, or game-like effects.

## Product and publishing boundaries

- Preserve the anonymous, free contemplative sanctuary boundary: no accounts, persistent visitor data, analytics, advertising, prayer-text collection, payments, AI, or provider resources unless separately approved.
- Do not claim a deployment is published without verification. If no deployment pipeline is configured, continue repository work and record deployment as unresolved.
- Preserve history. Work from `main` on `build/sanctuary-v2-mvp`; never rewrite history, force-push, or squash the incremental construction journey.
- Make each independently useful implementation step a small, understandable commit. Run the relevant checks, push each successful commit immediately, and verify the remote branch update.
- Do not add private records, credentials, local evidence, or non-product construction material to repository history.
