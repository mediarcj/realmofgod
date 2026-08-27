/**
 * File: scripts/validate-bootstrap-config.mjs
 * Description: Checks the small local configuration contract for the sanctuary package.
 * Purpose: Fails early when dependency pins or loopback-only development settings drift.
 * Notes: This script reads repository files only and does not contact a provider or network service.
 */

// Import only Node standard-library helpers so configuration validation has no runtime dependency.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Resolve paths from this file so invoking the script from another directory cannot change its scope.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspacePackagePath = resolve(repositoryRoot, "package.json");
const workspaceDefinitionPath = resolve(repositoryRoot, "pnpm-workspace.yaml");
const packagePath = resolve(repositoryRoot, "apps/sanctuary/package.json");
const viteConfigPath = resolve(repositoryRoot, "apps/sanctuary/vite.config.ts");
const viewportPath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/ExperienceViewport.tsx");
const canvasExperiencePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/CanvasExperience.tsx",
);
const realmScenePath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/RealmScene.tsx");
const hf01AssetAdapterPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/Hf01SanctuaryAsset.tsx",
);
const sanctuaryShellPath = resolve(repositoryRoot, "apps/sanctuary/src/SanctuaryShell.tsx");
const sanctuaryMainPath = resolve(repositoryRoot, "apps/sanctuary/src/main.tsx");
const sanctuaryCssPath = resolve(repositoryRoot, "apps/sanctuary/src/sanctuary.css");
const sanctuaryDocumentPath = resolve(repositoryRoot, "apps/sanctuary/index.html");
const orientationGatePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/SanctuaryOrientationGate.tsx",
);
const capabilityPath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/capabilities.ts");
const d9ScenePath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/D9SanctuaryScene.tsx");
const sanctuaryInteractionModelPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/sanctuary/model.ts",
);
const sanctuarySessionStatePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/sanctuary/sessionState.ts",
);
const sanctuaryHomeControlPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/sanctuary/SanctuaryHomeControl.tsx",
);
const sanctuaryHomePolicyPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/sanctuary/sanctuaryHomePolicy.ts",
);
const d9EnvironmentalAffordancePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9EnvironmentalAffordances.tsx",
);
const d9DomInteractionTargetPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9DomInteractionTarget.ts",
);
const d9AffordanceAnchorsPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9AffordanceAnchors.ts",
);
const d9AmbientCameraGlancePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9AmbientCameraGlance.tsx",
);
const d9AmbientCameraPolicyPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9AmbientCameraPolicy.ts",
);
const d9CameraTransitionControllerPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9CameraTransitionController.tsx",
);
const d9CameraTransitionPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9CameraTransition.ts",
);
const d9LivingSanctuaryAtmospherePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9LivingSanctuaryAtmosphere.tsx",
);
const d9LivingSanctuaryPolicyPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9LivingSanctuaryPolicy.ts",
);

// Read a UTF-8 repository file with a direct failure message when the expected contract is absent.
function readRepositoryFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`Expected configuration file is missing: ${path}`);
  }
}

// Keep the direct rendering dependencies exact so upgrades remain an intentional review decision.
function verifyExactRenderingPins(sanctuaryPackage) {
  const expectedPins = {
    "@react-three/fiber": "9.7.0",
    three: "0.185.1",
  };

  for (const [name, version] of Object.entries(expectedPins)) {
    if (sanctuaryPackage.dependencies?.[name] !== version) {
      throw new Error(`${name} must be pinned exactly to ${version}.`);
    }
  }

  if (sanctuaryPackage.devDependencies?.["@types/three"] !== "0.185.4") {
    throw new Error("@types/three must be pinned exactly to 0.185.4.");
  }
}

// Keep the offline asset CLI development-only and reject optional runtime libraries outside this scope.
function verifyAssetToolingBoundary(workspacePackage, sanctuaryPackage) {
  if (workspacePackage.devDependencies?.["@gltf-transform/cli"] !== "4.4.2") {
    throw new Error("@gltf-transform/cli must remain an exact workspace development pin at 4.4.2.");
  }

  const forbiddenPackages = [
    "@react-three/drei",
    "@theatre/core",
    "@theatre/studio",
    "@react-spring/three",
    "@react-three/postprocessing",
    "framer-motion",
    "gsap",
    "motion",
  ];
  const allDependencies = {
    ...workspacePackage.dependencies,
    ...workspacePackage.devDependencies,
    ...sanctuaryPackage.dependencies,
    ...sanctuaryPackage.devDependencies,
  };
  for (const packageName of forbiddenPackages) {
    if (packageName in allDependencies) {
      throw new Error(`${packageName} is outside the approved sanctuary asset scope.`);
    }
  }
}

// Keep the reviewed image processor override explicit until the pinned asset CLI adopts a patched range.
function verifyAssetToolingOverride(workspaceDefinition) {
  if (!workspaceDefinition.includes('"@gltf-transform/cli>sharp": 0.35.2')) {
    throw new Error("The glTF Transform Sharp override must remain pinned exactly to 0.35.2.");
  }
}

// Require explicit loopback settings and prevent convenience configuration from reopening a public host.
function verifyLoopbackViteSettings(viteConfig) {
  const requiredFragments = [
    'host: "127.0.0.1"',
    "cors: false",
    "publicDir: false",
    "polyfill: false",
  ];

  for (const fragment of requiredFragments) {
    if (!viteConfig.includes(fragment)) {
      throw new Error(`Vite configuration must include ${fragment}.`);
    }
  }
}

// Require the renderer-only imports to remain behind the local dynamic-import boundary.
function verifyAsynchronousRendererBoundary(viewportSource, canvasExperienceSource) {
  if (!viewportSource.includes('lazy(async () => import("./CanvasExperience"))')) {
    throw new Error("ExperienceViewport must lazy-load CanvasExperience.");
  }

  if (viewportSource.includes("@react-three/fiber") || viewportSource.includes("./RealmScene")) {
    throw new Error("ExperienceViewport must not eagerly import renderer-specific code.");
  }

  if (
    !canvasExperienceSource.includes("@react-three/fiber") ||
    !canvasExperienceSource.includes("./RealmScene")
  ) {
    throw new Error("CanvasExperience must contain the renderer-specific imports.");
  }
}

// Keep renderer recovery explicit and reject the two initialization options implicated in fragile Chrome sessions.
function verifyRendererRecoveryBoundary(viewportSource, canvasExperienceSource) {
  for (const requiredFragment of [
    "webglcontextlost",
    "creation-unavailable",
    "onRendererFailure",
  ]) {
    if (!canvasExperienceSource.includes(requiredFragment)) {
      throw new Error(`CanvasExperience must preserve ${requiredFragment} recovery behavior.`);
    }
  }

  for (const forbiddenFragment of [
    "preserveDrawingBuffer",
    'powerPreference: "high-performance"',
  ]) {
    if (canvasExperienceSource.includes(forbiddenFragment)) {
      throw new Error(`CanvasExperience must not force ${forbiddenFragment}.`);
    }
  }

  if (!viewportSource.includes('rendererState === "failed"')) {
    throw new Error(
      "ExperienceViewport must replace a failed renderer with its stable CSS fallback.",
    );
  }
}

// Keep development from mounting a second GPU renderer while preserving ordinary automated checks elsewhere.
function verifySingleRendererLifecycle(mainSource) {
  if (mainSource.includes("StrictMode")) {
    throw new Error(
      "The sanctuary entry must not replay its WebGL mount through React StrictMode.",
    );
  }
  if ((mainSource.match(/createRoot\s*\(/gu) ?? []).length !== 1) {
    throw new Error("The sanctuary entry must create exactly one React root.");
  }
}

// Require the optimized GLB and Meshopt decoder to remain local and inside the lazy renderer module graph.
function verifyAuthoredAssetBoundary(viewportSource, assetAdapterSource) {
  if (!assetAdapterSource.includes("realm-hf01-sanctuary.glb?url")) {
    throw new Error(
      "HF-01 must load the repository-owned production GLB through Vite's local URL import.",
    );
  }
  if (!assetAdapterSource.includes("three/addons/libs/meshopt_decoder.module.js")) {
    throw new Error(
      "HF-01 must use the local Meshopt decoder bundled with the pinned Three.js package.",
    );
  }
  if (/https?:\/\/|\bdispatch\s*\(|\btransitionJourney\b/iu.test(assetAdapterSource)) {
    throw new Error("The HF-01 asset adapter must have no remote URL or journey-action authority.");
  }
  if (assetAdapterSource.includes("uncacheRoot")) {
    throw new Error("HF-01 must preserve mixer bindings across React development effect replay.");
  }
  if (viewportSource.includes("Hf01SanctuaryAsset") || viewportSource.includes(".glb")) {
    throw new Error(
      "The lightweight viewport must not eagerly import the production sanctuary asset.",
    );
  }
}

// Keep the D9 root inside the sanctuary and ensure renderer code remains unable to create its own state authority.
function verifyVisitorVisualBoundary(shellSource, canvasSource, sceneSource) {
  for (const retiredRootFragment of ["JourneyExperience", "What brings you here?"]) {
    if (shellSource.includes(retiredRootFragment)) {
      throw new Error(
        `SanctuaryShell must not restore the retired entry journey: ${retiredRootFragment}.`,
      );
    }
  }

  if (canvasSource.includes("dispatch")) {
    throw new Error("CanvasExperience must not create or advance visitor state.");
  }

  if (sceneSource.includes("dispatch") || sceneSource.includes("transitionJourney")) {
    throw new Error("RealmScene must remain a read-only visual projection.");
  }
}

// Require the D9.0B interaction proof to remain an exact four-state, DOM-authoritative environmental path.
function verifyD9InteractionBoundary(
  shellSource,
  viewportSource,
  canvasSource,
  sceneSource,
  modelSource,
  sessionStateSource,
  homeControlSource,
  homePolicySource,
  affordanceSource,
  domTargetSource,
  anchorSource,
) {
  for (const requiredFragment of [
    "useSanctuarySessionState",
    "SanctuaryHomeControl",
    "sanctuary-environmental-control",
  ]) {
    if (!shellSource.includes(requiredFragment)) {
      throw new Error(
        `SanctuaryShell must preserve the D9.0B semantic interaction boundary: ${requiredFragment}.`,
      );
    }
  }

  // Keep the reducer lazy initializer and the reviewed session key inside their small semantic continuity boundary.
  for (const requiredFragment of [
    "useReducer",
    "transitionSanctuaryMvp",
    "sessionStorage",
    "realm.sanctuary.state.v1",
  ]) {
    if (!sessionStateSource.includes(requiredFragment)) {
      throw new Error(
        `Sanctuary session continuity must preserve ${requiredFragment} inside its reviewed boundary.`,
      );
    }
  }

  // Retain the project-owned, semantic Home control and its explicit accessible target contract without an icon dependency.
  for (const requiredFragment of ["Return to sanctuary", "aria-label", "<svg"]) {
    if (!homeControlSource.includes(requiredFragment)) {
      throw new Error(`Sanctuary Home control must preserve ${requiredFragment}.`);
    }
  }

  for (const requiredFragment of [
    "shouldShowSanctuaryHome",
    "sanctuaryHomeControlTargetSizePx",
    "44",
  ]) {
    if (!homePolicySource.includes(requiredFragment)) {
      throw new Error(`Sanctuary Home policy must preserve ${requiredFragment}.`);
    }
  }

  for (const forbiddenFragment of [
    "sanctuary-visitor-control",
    ">Sit</button>",
    "disabled aria-describedby",
  ]) {
    if (shellSource.includes(forbiddenFragment)) {
      throw new Error(
        `SanctuaryShell must not restore the retired visible SIT control: ${forbiddenFragment}.`,
      );
    }
  }

  for (const requiredFragment of [
    "SANCTUARY",
    "SIT",
    "READ",
    "PRAY",
    "RETURN_TO_SANCTUARY",
    "Sit in the sanctuary",
    "Read the open Bible",
    "Let's pray",
    "Return to sanctuary",
    "tabletop",
    "page-action",
    "reflection",
  ]) {
    if (!modelSource.includes(requiredFragment)) {
      throw new Error(`The guided state model must retain ${requiredFragment}.`);
    }
  }

  if (canvasSource.includes("transitionSanctuaryMvp") || canvasSource.includes("useReducer")) {
    throw new Error(
      "CanvasExperience must receive a read-only sanctuary state rather than own transitions.",
    );
  }

  for (const requiredFragment of ["D9EnvironmentalAffordances", "onInteractionTargetChange"]) {
    if (!sceneSource.includes(requiredFragment)) {
      throw new Error(
        `D9SanctuaryScene must preserve its DOM interaction projection: ${requiredFragment}.`,
      );
    }
  }

  if (canvasSource.includes("onSanctuaryInteraction")) {
    throw new Error("CanvasExperience must not own visitor pointer-action authority.");
  }

  for (const requiredFragment of [
    "D9ProjectedInteractionTarget",
    "d9-projected-interaction-target",
    "onInteraction",
  ]) {
    if (!viewportSource.includes(requiredFragment)) {
      throw new Error(
        `ExperienceViewport must preserve a bounded semantic DOM action: ${requiredFragment}.`,
      );
    }
  }

  for (const requiredFragment of ["pointLight", "onInteractionTargetChange", "reducedMotion"]) {
    if (!affordanceSource.includes(requiredFragment)) {
      throw new Error(
        `Environmental affordances must preserve the local visual cue boundary: ${requiredFragment}.`,
      );
    }
  }

  for (const requiredFragment of ["HF01_PrayerTable__Table_Top", "HF01_Bible_Root"]) {
    if (!anchorSource.includes(requiredFragment)) {
      throw new Error(`D9 DOM interaction anchors must preserve ${requiredFragment}.`);
    }
  }

  for (const requiredFragment of ["projectD9DomInteractionTarget"]) {
    if (!domTargetSource.includes(requiredFragment)) {
      throw new Error(`D9 DOM interaction projection must preserve ${requiredFragment}.`);
    }
  }

  // Keep the approved D9 baseline camera-authored: browser pointer motion must not re-enter as ambient movement.
  for (const [label, path] of [
    ["D9 ambient camera component", d9AmbientCameraGlancePath],
    ["D9 ambient camera policy", d9AmbientCameraPolicyPath],
  ]) {
    if (existsSync(path)) {
      throw new Error(`${label} must remain removed from the sanctuary interaction baseline.`);
    }
  }

  for (const forbiddenFragment of [
    "D9AmbientCameraGlance",
    "d9AmbientCameraPolicy",
    "diagnostic-affordances",
    "d9-affordance-diagnostics",
    "d9-diagnostic-state-tester",
    "d9-diagnostic-motion-override",
    "OrbitControls",
    "PointerLockControls",
    "KeyboardControls",
    "pointermove",
    "onPointerMove",
    "touchmove",
    "onTouchMove",
    "WASD",
  ]) {
    if (
      [shellSource, viewportSource, canvasSource, sceneSource].some((source) =>
        source.includes(forbiddenFragment),
      )
    ) {
      throw new Error(
        `The retired D9 pointer-camera or diagnostic surface returned: ${forbiddenFragment}.`,
      );
    }
  }
}

// Require the D9.0C.1 controller to remain the one rendering-layer camera writer while keeping all semantic state outside it.
function verifyD9CameraTransitionBoundary(canvasSource, controllerSource, transitionSource) {
  for (const requiredFragment of [
    "D9CameraTransitionController",
    "d9CameraTransitionEnabled",
    "d9CameraTransitionActive",
  ]) {
    if (!canvasSource.includes(requiredFragment)) {
      throw new Error(
        `CanvasExperience must preserve the D9.0C.0 transition boundary: ${requiredFragment}.`,
      );
    }
  }

  for (const requiredFragment of [
    "useFrame",
    "invalidate",
    "reducedMotion",
    "data-d9-camera-transition",
    "captureD9CameraPose",
    "createD9CameraEndpoint",
    "sampleD9CameraTransition",
  ]) {
    if (!controllerSource.includes(requiredFragment)) {
      throw new Error(`D9CameraTransitionController must preserve ${requiredFragment}.`);
    }
  }

  for (const requiredFragment of [
    "d75SanctuaryCameras",
    "slerpQuaternions",
    "d9CameraTransitionDurationsMs",
    "d9SanctuaryToSitDurationMs",
    "selectD9CameraTransitionPlan",
    "shouldInvalidateD9CameraTransition",
  ]) {
    if (!transitionSource.includes(requiredFragment)) {
      throw new Error(`D9 camera transition math must preserve ${requiredFragment}.`);
    }
  }

  // Keep each owner-approved guided move explicit; presentation may grow only through a later owner review.
  for (const requiredRoute of [
    "sanctuary-to-sit",
    "sit-to-read",
    "read-to-pray",
    "pray-to-sanctuary",
    "sit-home-to-sanctuary",
    "read-home-to-sanctuary",
  ]) {
    if (!transitionSource.includes(requiredRoute)) {
      throw new Error(`D9 camera transition math must preserve ${requiredRoute}.`);
    }
  }

  for (const forbiddenFragment of [
    "transitionSanctuaryMvp",
    "useReducer",
    "localStorage",
    "sessionStorage",
  ]) {
    if (
      controllerSource.includes(forbiddenFragment) ||
      transitionSource.includes(forbiddenFragment)
    ) {
      throw new Error(
        `D9 camera presentation must not own semantic state or browser persistence: ${forbiddenFragment}.`,
      );
    }
  }
}

// Require both CSS and renderer motion paths to keep an intentional reduced-motion behavior.
function verifyMotionBoundary(cssSource, sceneSource) {
  if (!cssSource.includes("@media (prefers-reduced-motion: reduce)")) {
    throw new Error("Sanctuary CSS must preserve a reduced-motion composition.");
  }

  if (!sceneSource.includes("if (reducedMotion && authoredSceneReady)")) {
    throw new Error("RealmScene must settle immediately when reduced motion is requested.");
  }
}

// Preserve browser zoom as an accessibility capability while limiting viewport eligibility to actual usable dimensions.
function verifyViewportAccessibilityBoundary(documentSource, gateSource, capabilitySource) {
  if (!documentSource.includes('name="viewport" content="width=device-width, initial-scale=1.0"')) {
    throw new Error("The sanctuary document must retain its zoom-permitting viewport metadata.");
  }

  const forbiddenZoomControls = [
    /user-scalable\s*=\s*(?:no|0|false)/iu,
    /maximum-scale\s*=\s*1(?:\.0+)?(?:\D|$)/iu,
    /(?:wheel|gesturestart|gesturechange|touchmove)[\s\S]{0,240}preventDefault\s*\(/iu,
    /(?:ctrlKey|metaKey)[\s\S]{0,240}preventDefault\s*\(/iu,
  ];
  const browserSources = [documentSource, gateSource, capabilitySource].join("\n");
  for (const forbiddenZoomControl of forbiddenZoomControls) {
    if (forbiddenZoomControl.test(browserSources)) {
      throw new Error(
        "The sanctuary must not suppress browser zoom or pinch accessibility controls.",
      );
    }
  }

  if (capabilitySource.includes("userAgent") || capabilitySource.includes("navigator.userAgent")) {
    throw new Error("Viewport presentation must not use user-agent detection.");
  }
  for (const requiredFragment of [
    "permitsCanvas: false",
    "Turn your phone sideways to enter.",
    "Zoom out or enlarge this browser window to continue.",
  ]) {
    if (!capabilitySource.includes(requiredFragment)) {
      throw new Error(`Viewport presentation must preserve: ${requiredFragment}`);
    }
  }
  if (!gateSource.includes("if (notice.permitsCanvas)")) {
    throw new Error(
      "The orientation gate must withhold its children until the viewport permits Canvas.",
    );
  }
}

// Keep the accepted D9 visitor renderer distinct from diagnostic routes after viewport cleanup.
function verifyD9VisitorQualityBoundary(canvasSource, d9SceneSource) {
  for (const requiredFragment of ["D9SanctuaryScene", "d9QualityRendererActive", "antialias"]) {
    if (!canvasSource.includes(requiredFragment)) {
      throw new Error(
        `CanvasExperience must preserve the D9 visitor-quality boundary: ${requiredFragment}.`,
      );
    }
  }
  for (const requiredFragment of ["D9Lighting", "<pointLight", "D9RuntimeMetrics"]) {
    if (!d9SceneSource.includes(requiredFragment)) {
      throw new Error(
        `D9SanctuaryScene must preserve the accepted visitor scene contract: ${requiredFragment}.`,
      );
    }
  }
}

// Keep D9.1 atmosphere visual-only, paced in demand mode, and separate from camera/reducer or browser-persistence authority.
function verifyD9LivingSanctuaryBoundary(
  canvasSource,
  d9SceneSource,
  atmosphereSource,
  policySource,
) {
  for (const requiredFragment of [
    'frameloop={d9QualityRendererActive ? "demand" : "always"}',
    "D9LivingSanctuaryAtmosphere",
  ]) {
    if (!canvasSource.includes(requiredFragment) && !d9SceneSource.includes(requiredFragment)) {
      throw new Error(`D9.1 must preserve the living-sanctuary boundary: ${requiredFragment}.`);
    }
  }

  for (const requiredFragment of [
    "useFrame",
    "setTimeout",
    "visibilitychange",
    "document.hidden",
    "D9_CandleLeft_RuntimeLight",
    "D9_CandleRight_RuntimeLight",
    "D9_Exterior_RuntimeLight",
    "<points",
  ]) {
    if (!atmosphereSource.includes(requiredFragment)) {
      throw new Error(`D9.1 atmosphere must preserve ${requiredFragment}.`);
    }
  }

  for (const requiredFragment of [
    "d9CandleChannels",
    "d9MaximumDustParticleCount",
    "createD9RareEventSchedule",
    "shouldD9AtmosphereScheduleFrames",
  ]) {
    if (!policySource.includes(requiredFragment)) {
      throw new Error(`D9.1 atmosphere policy must preserve ${requiredFragment}.`);
    }
  }

  for (const forbiddenFragment of [
    "useState(",
    "localStorage",
    "sessionStorage",
    "dispatch",
    "OrbitControls",
  ]) {
    if (atmosphereSource.includes(forbiddenFragment) || policySource.includes(forbiddenFragment)) {
      throw new Error(`D9.1 atmosphere must not introduce ${forbiddenFragment}.`);
    }
  }
}

// Keep local visual-check fragments out of production behavior while retaining repeatable browser evidence.
function verifyLocalVisualChecks(capabilitySource) {
  if (!capabilitySource.includes("import.meta.env.DEV")) {
    throw new Error("Local visual-check fragments must remain development-only.");
  }
}

// Parse and validate the small package contract before reporting one clear success line.
const sanctuaryPackage = JSON.parse(readRepositoryFile(packagePath));
const workspacePackage = JSON.parse(readRepositoryFile(workspacePackagePath));
verifyExactRenderingPins(sanctuaryPackage);
verifyAssetToolingBoundary(workspacePackage, sanctuaryPackage);
verifyAssetToolingOverride(readRepositoryFile(workspaceDefinitionPath));
verifyLoopbackViteSettings(readRepositoryFile(viteConfigPath));
verifyAsynchronousRendererBoundary(
  readRepositoryFile(viewportPath),
  readRepositoryFile(canvasExperiencePath),
);
verifyRendererRecoveryBoundary(
  readRepositoryFile(viewportPath),
  readRepositoryFile(canvasExperiencePath),
);
verifySingleRendererLifecycle(readRepositoryFile(sanctuaryMainPath));
verifyAuthoredAssetBoundary(
  readRepositoryFile(viewportPath),
  readRepositoryFile(hf01AssetAdapterPath),
);
verifyVisitorVisualBoundary(
  readRepositoryFile(sanctuaryShellPath),
  readRepositoryFile(canvasExperiencePath),
  readRepositoryFile(realmScenePath),
);
verifyD9InteractionBoundary(
  readRepositoryFile(sanctuaryShellPath),
  readRepositoryFile(viewportPath),
  readRepositoryFile(canvasExperiencePath),
  readRepositoryFile(d9ScenePath),
  readRepositoryFile(sanctuaryInteractionModelPath),
  readRepositoryFile(sanctuarySessionStatePath),
  readRepositoryFile(sanctuaryHomeControlPath),
  readRepositoryFile(sanctuaryHomePolicyPath),
  readRepositoryFile(d9EnvironmentalAffordancePath),
  readRepositoryFile(d9DomInteractionTargetPath),
  readRepositoryFile(d9AffordanceAnchorsPath),
);
verifyD9CameraTransitionBoundary(
  readRepositoryFile(canvasExperiencePath),
  readRepositoryFile(d9CameraTransitionControllerPath),
  readRepositoryFile(d9CameraTransitionPath),
);
verifyMotionBoundary(readRepositoryFile(sanctuaryCssPath), readRepositoryFile(realmScenePath));
verifyViewportAccessibilityBoundary(
  readRepositoryFile(sanctuaryDocumentPath),
  readRepositoryFile(orientationGatePath),
  readRepositoryFile(capabilityPath),
);
verifyD9VisitorQualityBoundary(
  readRepositoryFile(canvasExperiencePath),
  readRepositoryFile(d9ScenePath),
);
verifyD9LivingSanctuaryBoundary(
  readRepositoryFile(canvasExperiencePath),
  readRepositoryFile(d9ScenePath),
  readRepositoryFile(d9LivingSanctuaryAtmospherePath),
  readRepositoryFile(d9LivingSanctuaryPolicyPath),
);
verifyLocalVisualChecks(readRepositoryFile(capabilityPath));
console.log("Bootstrap configuration checks passed.");
