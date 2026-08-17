<!--
File: artifacts/browser/hf01-recovery/README.md
Description: Records the actual Chromium screenshots and renderer checks for the HF-01 recovery.
Purpose: Keeps the browser evidence reviewable with the source change that produced it.
Notes: Images contain synthetic sanctuary content only and were captured from the loopback development server.
-->

# HF-01 browser renderer recovery evidence

These screenshots come from the actual Realm of God DOM and Canvas running in a Chromium browser at
`127.0.0.1`. They are not Blender substitutes.

- `01-entry-room.jpg` — the authored entry scene after the local GLB becomes ready.
- `02-door-mid-close.jpg` — the physical door during the synchronized arrival transition.
- `03-settled-sanctuary.jpg` — the stable room composition after camera and clips settle.
- `04-bible-partially-closed.jpg` — the authored Bible during its opening clip.
- `05-bible-settled-open.jpg` — the authored Bible at the settled clip pose.
- `06-mobile-390x844-entry.jpg` — the live entry at an exact 390 by 844 viewport.
- `07-reduced-motion-entry.jpg` — the deterministic development-only reduced-motion check.
- `08-forced-fallback-entry.jpg` — the deterministic development-only CSS fallback check.
- `09-final-normal-chromium.jpg` — the final ordinary renderer path after all source changes.

The A–E renderer isolation matrix passed in WebGL2 with no fallback:

- A: bare Canvas and local color/box; no GLB, animation, or shadows.
- B: Canvas and local GLB; no authored clips, runtime lights, or shadows.
- C: GLB plus bounded static runtime lights; no clips or shadows.
- D: GLB, static lights, and authored clips; no dynamic shadows or antialiasing.
- E: the full stress check, including dynamic shadows and antialiasing.

The ordinary sanctuary uses the safer D-level renderer profile. The E-level stress path remains
development-only so future browser checks can isolate optional GPU cost without silently raising the
production baseline.
