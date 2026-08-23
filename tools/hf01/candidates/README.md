<!--
File: tools/hf01/candidates/README.md
Description: Records the bounded review role of the static R2 sanctuary artifacts.
Purpose: Keeps raw authored input and its conservative browser candidate distinguishable from the production rollback asset.
Notes: This directory contains no Blender source file, render, secret, or remote asset reference.
-->

# Static sanctuary candidate

`realm-mvp-sanctuary-v1-raw-r2.glb` is the unmodified, staged authored input for review. Its
required SHA-256 is `641793795a4739e144d170ca7140e40b05cf72bc43e73bed708b2aa404893c75` and its
expected size is 1,100,820 bytes.

The browser candidate is stored separately at
`apps/sanctuary/src/assets/candidates/realm-mvp-sanctuary-v1-r2-meshopt.glb`. It was created with
glTF Transform's Meshopt transform only: no Draco compression, texture conversion, material rename,
hierarchy flattening, or mesh joining is part of this review.

The existing `apps/sanctuary/src/assets/production/realm-hf01-sanctuary.glb` remains the production
rollback asset. The candidate has no production promotion in this change.
