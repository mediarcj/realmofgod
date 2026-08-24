/**
 * File: scripts/validate-bootstrap-config.mjs
 * Description: Checks the small local configuration contract for the sanctuary package.
 * Purpose: Fails early when dependency pins or loopback-only development settings drift.
 * Notes: This script reads repository files only and does not contact a provider or network service.
 */

// Import only Node standard-library helpers so configuration validation has no runtime dependency.
import { readFileSync } from "node:fs";
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

// Keep the D9 root inside the sanctuary and ensure renderer code remains unable to advance a visitor state machine.
function verifyVisitorVisualBoundary(shellSource, canvasSource, sceneSource) {
  for (const retiredRootFragment of ["useReducer", "JourneyExperience", "What brings you here?"]) {
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
verifyLocalVisualChecks(readRepositoryFile(capabilityPath));
console.log("Bootstrap configuration checks passed.");
