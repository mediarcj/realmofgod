# File: tools/hf01/ASSET_PROVENANCE.md

# Description: Records the ownership, tools, optimization, and measured facts for the HF-01 sanctuary asset.

# Purpose: Makes the locally authored production asset reviewable without relying on private construction history.

# Notes: This record contains no secret, provider credential, remote runtime dependency, or visitor data.

# HF-01 Sanctuary Asset Provenance

- Asset ID: `ROG-HF01-SANCTUARY-001`
- Runtime asset: `apps/sanctuary/src/assets/production/realm-hf01-sanctuary.glb`
- Editable source: `tools/hf01/source/realm-hf01-sanctuary.blend`
- Reproducible authoring source: `tools/hf01/build_hf01_sanctuary.py`
- Description: old-world paneled-wood prayer refuge, centered plank door with long iron straps,
  handmade trestle prayer table, substantial open Bible, reflective laid-down steel cross, exactly
  two complete candle fixtures, and a limited irregular exterior glimpse
- Creator and tool: locally authored for Realm of God with Blender 5.2.0 LTS
- Direction source: owner-provided HF-01 descriptions and local visual references used only for
  observation and calibration; no reference pixel, model, photograph, font, HDRI, watermark, or
  other reference media entered the authored asset or production bundle
- Ownership and license posture: project-controlled geometry plus Poly Haven `fine_grained_wood` 1K
  base-color, OpenGL-normal, and roughness maps under CC0; Poly Haven identifies the asset author as
  Rob Tuytel and permits commercial use, modification, and redistribution without attribution
- Local texture sources: `tools/hf01/source/textures/cc0-fine-grained-wood-*.jpg`; reviewed source
  page `https://polyhaven.com/a/fine_grained_wood`; license `https://polyhaven.com/license`;
  downloaded only during authoring and embedded locally, with no production network request
- Source MD5 checks: base color `3db9decdde678e087e67ff99d30c0a73`; OpenGL normal
  `a9e33e87ea5c32945fc30553767b7046`; roughness `5e29204cca6747b5df219e9a7255540f`
- glTF pipeline: glTF 2.0 binary, metallic/roughness PBR, local CC0 and locally generated source
  maps, WebP production maps, and Meshopt geometry and animation compression
- Optimization command: `corepack pnpm asset:hf01:build`
- Runtime loader: local Three.js `GLTFLoader` with the Three.js-bundled local `MeshoptDecoder`,
  behind the existing asynchronous renderer boundary
- Approved animation clips: `Realm_Door_Close` and `Realm_Bible_Settle_Open`
- Scripture boundary: the asset contains no verse, page wording, chapter text, or Scripture
  quotation; its page marks are short non-semantic physical strokes only
- Baked-lighting decision: no lightmap was added because standard portable glTF has no native
  lightmap semantic and the room retains animated door/Bible nodes; localized candle shadows,
  restrained environment reflection, and authored contact geometry gave the maintainable gain
- Optimized byte size: 740,424 bytes at the reference-locked production-master candidate
- Visible geometry: 34,940 triangles and 88 draw calls at the production-master candidate
- Material and texture set: 15 materials and 8 embedded WebP textures; maximum dimension 1,024 by
  1,024 pixels
- Final artistic acceptance: pending owner visual review
