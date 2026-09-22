<!--
File: AGENTS.md
Description: Records the enduring Sanctuary V2 implementation contract.
Purpose: Keeps the browser sanctuary aligned with its accepted visual source and product boundaries.
Notes: The contract applies to every Sanctuary V2 change.
-->

# Sanctuary V2 build rules

## Visual source and assets

- Every active runtime asset, including candles and candle holders, is derived only from `Realm_of_God_NEW_SANCTUARY_v2_CEILING_LEVEL_v28_4_4.blend`, SHA-256 `118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36`.
- The production exporter and validators must fail closed unless this exact path and SHA are the active source. Never merge, append, link, or use another Blender source for active runtime work.
- Never modify, save over, simplify, or export into the accepted Blender master. Browser assets are separate derivatives only.
- Do not use the former v26.1.0 or rejected v26.2.0 files as visual or geometry sources.
- Do not reuse historical browser-room geometry or placeholders. Historical branches may be inspected for non-visual utilities and lessons only.

## Application architecture

- Production uses the Next.js App Router with React, TypeScript, Three.js, and React Three Fiber. Do not use Vite for the production application.
- Keep browser-only rendering behind client components. Use dependencies sparingly and prefer clear local code for sanctuary-specific behavior.
- Blender owns static geometry, transforms, materials, semantic names, and anchors. The browser owns rendering, interaction, camera behavior, responsive presentation, and living effects.
- Inspect the Blender scene with reusable `bpy` tooling. Export inventories must retain discovered object names, hierarchy, transforms, materials, `rog_*` metadata, anchors, and export policy.
- Keep source/master derivatives distinct from optimized web derivatives. Measure before optimization and protect defining silhouettes, proportions, contact points, altar detail, and Bible detail.

## Runtime rendering ownership

- Blender owns canonical geometry, transforms, semantic material zones and names, authored UV layout, normals, baked source information, and anchors.
- Browser Three.js / React Three Fiber owns final runtime PBR material implementation, texture sampling, roughness and normal response, environmental reflections, final lighting, runtime shadows, candle illumination, atmosphere, tone mapping, and restrained post-processing.
- Do not treat Blender's simple viewport materials as the final browser appearance.

## Sanctuary construction

- Build incrementally: web foundation, floor, walls and openings, windows, clerestory and structural detail, trim, altar, devotional objects, anchors, runtime effects, responsive behavior, performance, accessibility, and polish.
- The floor is the first physical sanctuary object. Export and verify it independently before introducing later architecture.
- Use discovered runtime anchors rather than guessed coordinates. Current expected categories include Bible and prayer anchors, sunlight and dust anchors, plus candle flame, smoke, and light anchors.
- Implement candle flame, candle-light flicker, smoke, dust, sunlight shafts, and atmospheric haze at runtime. Keep candle flames disabled until the base geometry/material browser scene is confirmed working; avoid obvious proxy geometry, heavy particles, game-like effects, and any ceiling-cross glow.

## Product and publishing boundaries

- Preserve the anonymous, free contemplative sanctuary boundary: no accounts, persistent visitor data, analytics, advertising, prayer-text collection, payments, AI, or provider resources unless separately approved.
- Do not claim a deployment is published without verification. If no deployment pipeline is configured, continue repository work and record deployment as unresolved.
- Preserve history. Work from `main` on `build/sanctuary-v2-mvp`; never rewrite history, force-push, or squash the incremental construction journey.
- Make each independently useful implementation step a small, understandable commit. Run the relevant checks, push each successful commit immediately, and verify the remote branch update.
- Write future commit subjects as short, natural developer history. Do not use process, attribution, approval, or workflow meta-language unless the literal product concept requires the term.
- Do not add private records, credentials, local evidence, or non-product construction material to repository history.
