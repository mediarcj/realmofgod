// File: apps/sanctuary/scripts/build-runtime-contract.mjs
// Description: Curates application anchors from the measured source inventory.
// Purpose: Transfers source transforms without publishing private authoring metadata.
// Notes: Takes the read-only inspector JSON as its sole input authority.

import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { Matrix4, Vector3 } from "three";

const [input, output, geometryOutput] = process.argv.slice(2);
assert(input && output && geometryOutput, "Usage: build-runtime-contract.mjs inventory.json contract.json geometry.json");
const source = JSON.parse(readFileSync(input));
const expected = "fc0357a2335e3ed7205a4035d2baf2bedae5ac8e5b7934dd24382d19b89a1c24";
assert.equal(source.source.sha256, expected);
assert.equal(source.scene.unit_scale, 1);
const axis = new Matrix4().makeRotationX(-Math.PI / 2);
const inverseAxis = axis.clone().invert();
const selected = source.objects.filter((object) => object.rog_metadata.rog_export_policy === "EXPORT_AS_GLTF_EMPTY" || object.rog_metadata.rog_category === "RUNTIME_LIGHT");
const anchors = selected.map((object) => {
  const original = new Matrix4().set(...object.transform.matrix_world.flat());
  const world = axis.clone().multiply(original).multiply(inverseAxis);
  const position = new Vector3().setFromMatrixPosition(world).toArray();
  const direction = new Vector3(0, 0, -1).transformDirection(original).transformDirection(axis).toArray();
  const meta = object.rog_metadata;
  return { name: object.name, role: meta.rog_interaction_role, host: meta.rog_host_object ?? null,
    bank: meta.rog_window_bank ?? null, policy: meta.rog_export_policy,
    position, matrix: world.toArray(), direction, detail: object.detail };
});
assert.equal(anchors.length, 25);
const reference = source.objects.find((object) => object.name === "ROG_V2_Cam_LOWER_MATCHED_NORTH");
assert(reference);
const cameraPosition = new Vector3().setFromMatrixPosition(new Matrix4().set(...reference.transform.matrix_world.flat())).applyMatrix4(axis).toArray();
const geometry = source.objects.filter((object) => ["MESH", "CURVE"].includes(object.type)).map((object) => ({
  name: object.name, category: object.rog_metadata.rog_category, policy: object.rog_metadata.rog_export_policy,
  triangles: object.detail.triangles, matrix: object.transform.matrix_world,
  bounds: object.bounds_world, materials: object.materials,
}));
writeFileSync(output, JSON.stringify({ source_sha256: expected, coordinates: "glTF Y-up, metres",
  reference_camera: { name: reference.name, position: cameraPosition }, anchors }, null, 2) + "\n");
writeFileSync(geometryOutput, JSON.stringify({ source_sha256: expected, geometry }, null, 2) + "\n");
console.log(`Curated ${anchors.length} runtime anchors and ${geometry.length} source geometry names.`);
