# File: tools/hf01/ASSET_PROVENANCE.md

# Description: Records the ownership, tools, optimization, and measured facts for the HF-01 sanctuary asset.

# Purpose: Makes the locally authored production asset reviewable without relying on private construction history.

# Notes: This record contains no secret, provider credential, downloaded artwork, or visitor data.

# HF-01 Sanctuary Asset Provenance

- Asset ID: `ROG-HF01-SANCTUARY-001`
- Runtime asset: `apps/sanctuary/src/assets/production/realm-hf01-sanctuary.glb`
- Editable source: `tools/hf01/source/realm-hf01-sanctuary.blend`
- Reproducible authoring source: `tools/hf01/build_hf01_sanctuary.py`
- Description: aged horizontal-timber prayer refuge, centered physical door and hardware, broad low
  prayer table, substantial blank Bible, two complete candle fixtures, and a limited irregular
  exterior glimpse
- Creator and tool: locally authored for Realm of God with Blender 5.2.0 LTS
- Direction source: owner-provided HF-01 description plus two owner-supplied local visual references
  used only for observation and calibration; no reference pixel, model, texture, photograph, font,
  HDRI, watermark, or other third-party visual entered the authored asset, application source,
  runtime media, or production bundle
- Ownership and license posture: original project-controlled asset for Realm of God; no third-party
  visual license applies
- glTF pipeline: glTF 2.0 binary, metallic/roughness PBR, locally generated PNG source maps, WebP
  production maps, Meshopt geometry and animation compression
- Optimization command: `corepack pnpm asset:hf01:build`
- Runtime loader: local Three.js `GLTFLoader` with the Three.js-bundled local `MeshoptDecoder`,
  behind the existing asynchronous renderer boundary
- Approved animation clips: `Realm_Door_Close` and `Realm_Bible_Settle_Open`
- Scripture boundary: the asset contains no verse, page wording, chapter text, or Scripture
  quotation
- Optimized byte size: 545,364 bytes at the reference-locked HF-01 build
- Visible geometry: 24,860 triangles and 61 draw calls at the reference-locked HF-01 build
- Texture set: 9 embedded WebP textures; maximum dimension 512 by 512 pixels
- Final artistic acceptance: pending owner visual review
