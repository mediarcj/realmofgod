<!--
File: docs/realm-mvp-d7-visual-lock.md
Description: Records the approved D7 sanctuary experience and its Blender-to-browser boundary.
Purpose: Gives the next integration step a concise, versioned art-direction contract without claiming that pending runtime work already exists.
Notes: The approved full-resolution Blender renders remain outside this repository.
-->

# Realm MVP D7 Visual Lock

Realm of God MVP is one living Christian prayer sanctuary. Its approved controlled flow is:

```text
SANCTUARY → SIT → READ → PRAY → RETURN to SANCTUARY
```

There is no visitor free-roaming camera. The four approved Blender camera compositions are locked as
the art-direction reference for the next browser integration step.

| State     | Meaning                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SANCTUARY | The visitor has entered and is standing while looking into the sanctuary.                                                                 |
| SIT       | The visitor is seated and looking naturally forward.                                                                                      |
| READ      | The visitor remains seated while the camera naturally directs attention down to the open Bible, where Scripture can be presented legibly. |
| PRAY      | The visitor remains seated while the camera naturally lifts toward the north clerestory and upper sanctuary.                              |
| RETURN    | An application action that returns the visitor to SANCTUARY.                                                                              |

## Production boundary

Environment authored in Blender and delivered through a versioned glTF/GLB production boundary.

- Blender owns the environment and architectural authoring, physical props, materials, camera
  composition, visual-reference authoring, and the production GLB source.
- React Three Fiber and Three.js own controlled real-time camera motion, living candle behavior,
  runtime candle lights, sparse dust, restrained environmental-light response, Scripture/runtime UI,
  accessibility, reduced-motion behavior, and browser/mobile performance.
- The accessible DOM remains authoritative for essential text and controls. Scripture is not baked
  into WebGL.

## Approved MVP shape

The target sanctuary experience has one static Blender-authored production asset with a static
front/north door, an open Bible from the initial state, two candles, and a plain thick polished
steel cross lying flat. It has no arrival traversal, free roaming, WASD controls, OrbitControls,
drag-to-look interaction, giant welcome/title overlay, prayer-text input, or prayer-text storage
requirement.

The approved camera values are stored without alteration in
[`artifacts/calibration/realm-mvp-d7.5-camera-calibration.json`](../artifacts/calibration/realm-mvp-d7.5-camera-calibration.json).
They are an engineering and art-direction contract for later R3F calibration, not browser runtime
values by themselves.

## Current runtime and next integration

This visual lock does not replace the currently shipped proof asset or runtime behavior. At this
checkpoint, the application still uses its existing HF-01 GLB and its existing proof journey,
including the named door and Bible clips. The next authorized asset-integration step must replace
that contract deliberately; it must not infer that the locked D7 state is already implemented.

The four full-resolution Blender reference renders are deliberately outside Git. They are authoring
references, not runtime assets or application downloads.
