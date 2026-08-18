# File: artifacts/browser/hf01-reference-calibration/README.md

# Description: Records actual browser evidence for the reference-locked HF-01 sanctuary correction.

# Purpose: Keeps visual-comparison, Bible-pose, mobile, reduced-motion, and fallback results reviewable.

# Notes: The owner reference files remain outside the repository and are not production assets.

# HF-01 Reference Calibration Evidence

## Reference inspection

The supplied hero still and eight-frame motion contact sheet were inspected directly from the
owner's local files before source changes. They were not copied into the runtime tree, production
bundle, or this evidence directory. The development overlay loaded the hero still from a local File
API selection into a memory-only object URL.

## Captures

- `02-desktop-candidate.jpg`: actual 1280 × 720 local application after the reviewed centered-room,
  wall-height, camera-target, warm-light, two-candle, and Bible corrections.
- `03-reference-overlay.jpg`: actual development overlay comparison at 50 percent reference opacity.
  The image is evidence of the memory-only local tool and is not reachable from the production app.
- `04-bible-partially-closed.jpg`: actual deterministic partial-pose review after the cover/page
  keyframes were tightened to avoid a fan of upright slabs.
- `05-bible-settled-open.jpg`: actual deterministic settled-open pose.
- `06-mobile-390x844.jpg`: actual Canvas at exactly 390 × 844; document width also measured 390 with
  no horizontal overflow.
- `07-reduced-motion.jpg`: exact development reduced-motion check at 390 × 844. The selected browser
  already preferred reduced motion, so the stable image intentionally matches the mobile capture.
- `08-fallback.jpg`: exact development fallback check at 390 × 844 with zero Canvas elements and
  renderer state `unavailable`.

## Browser facts

- Desktop and mobile candidates reported renderer state `ready`.
- Mobile measured `window.innerWidth = 390` and `document.documentElement.scrollWidth = 390`.
- Reduced motion reported `data-reduced-motion="true"` with renderer state `ready`.
- Forced fallback reported renderer state `unavailable` and `canvasCount = 0`.
- The calibration console changed camera and lighting values live, copied calibration JSON, reset to
  reviewed defaults, supported overlay and side-by-side modes, and lost its selected reference after
  page reload as intended.
- A production build scan separately proves that the console, reference controls, and their CSS do
  not appear in production output.

These checks establish technical behavior only. The owner retains final artistic acceptance.
