<!--
File: README.md
Description: Introduces the Realm of God project.
Purpose: Gives contributors a concise description of the product.
Notes: None.
-->

# Realm of God

Realm of God is an anonymous Christian prayer sanctuary MVP. The approved controlled experience is:

```text
SANCTUARY → SIT → READ → PRAY → RETURN to SANCTUARY
```

The MVP has no visitor free-roaming camera, WASD controls, OrbitControls, drag-to-look, arrival
traversal, account, prayer-text input, prayer-text storage, database, billing, AI, or analytics. The
front/north door is static, the Bible begins open, and essential text and controls remain in the
accessible DOM. Scripture is not baked into WebGL.

## Current checkpoint

The approved D7 visual lock defines the next static Blender-authored sanctuary production asset and
the controlled SANCTUARY, SIT, READ, and PRAY camera compositions. The current runtime still
contains the earlier proof implementation until its future integration is separately completed. See
[the D7 visual lock](docs/realm-mvp-d7-visual-lock.md) for the explicit current-versus-target
boundary and the versioned camera-calibration artifact.

## Local foundation

The repository contains one isolated `@realmofgod/sanctuary` package. It combines a small React/Vite
browser shell with a DOM-first visual rendering boundary. Blender produces the static production
sanctuary asset; React Three Fiber and Three.js provide only runtime effects and controlled camera
behavior.

Local work uses Node.js 24.19.0, pnpm 11.21.0, and synthetic data only. It does not require a hosted
account or production credential. The existing local rendering proof uses exact-pinned Three.js and
React Three Fiber with a readable fallback for browsers that cannot initialize graphics.
