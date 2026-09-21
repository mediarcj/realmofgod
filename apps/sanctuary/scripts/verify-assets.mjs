// File: apps/sanctuary/scripts/verify-assets.mjs
// Description: Checks browser derivatives against their measured Blender contracts.
// Purpose: Detects duplicate or foreign meshes and axis, placement, size, or content drift.
// Notes: Decodes actual glTF vertices and world matrices, independently of the exporter.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

await MeshoptDecoder.ready;

const base = process.argv[2] ? pathToFileURL(resolve(process.argv[2]) + "/") : new URL("../public/models/sanctuary/", import.meta.url);
const architectureSourceSha = "118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36";
const candleSourceSha = "9b6852358af32c625589d5108249c5da4947d1aeb31bcf8e30a398ece290fd6b";
const seen = new Set();
let triangles = 0, bytes = 0;
for (const file of readdirSync(base).filter((name) => name.endsWith(".glb"))) {
  const data = readFileSync(new URL(file, base));
  const contract = JSON.parse(readFileSync(new URL(file.replace(".glb", ".json"), base)));
  const expectedSourceSha = file === "altar-candles-runtime.glb" ? candleSourceSha : architectureSourceSha;
  assert.equal(contract.source_sha256, expectedSourceSha, `Wrong source authority: ${file}`);
  assert.equal(createHash("sha256").update(data).digest("hex"), contract.sha256);
  assert.equal(data.readUInt32LE(0), 0x46546c67);
  assert.equal(data.readUInt32LE(8), data.length);
  const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)));
  const binaryStart = 28 + data.readUInt32LE(12);
  const views = gltf.bufferViews.map((view) => {
    const extension = view.extensions?.EXT_meshopt_compression;
    if (!extension) return data.subarray(binaryStart + (view.byteOffset ?? 0), binaryStart + (view.byteOffset ?? 0) + view.byteLength);
    const decoded = new Uint8Array(extension.count * extension.byteStride);
    MeshoptDecoder.decodeGltfBuffer(decoded, extension.count, extension.byteStride,
      data.subarray(binaryStart + (extension.byteOffset ?? 0), binaryStart + (extension.byteOffset ?? 0) + extension.byteLength), extension.mode, extension.filter);
    return decoded;
  });
  const nodes = gltf.nodes.filter((node) => node.mesh !== undefined);
  const worldMatrix = (node) => {
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3(...(node.translation ?? [0, 0, 0])),
      new Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new Vector3(...(node.scale ?? [1, 1, 1])));
    const parent = gltf.nodes.find((candidate) => candidate.children?.includes(gltf.nodes.indexOf(node)));
    return parent ? worldMatrix(parent).multiply(local) : local;
  };
  assert.deepEqual(nodes.map((n) => n.name).sort(), contract.objects.map((o) => o.name).sort());
  for (const node of nodes) {
    assert(!seen.has(node.name), `Duplicate geometry: ${node.name}`);
    seen.add(node.name);
    const source = contract.objects.find((o) => o.name === node.name);
    const matrix = worldMatrix(node);
    const box = new Box3();
    let count = 0;
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      assert.equal(primitive.mode ?? 4, 4);
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      const divisor = accessor.normalized ? ({ 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[accessor.componentType]) : 1;
      assert(divisor, "Unsupported normalized position component");
      const decode = (values) => values.map((value) => Math.max(accessor.componentType === 5120 || accessor.componentType === 5122 ? -1 : 0, value / divisor));
      assert(!accessor.sparse, "Sparse positions require explicit decoding");
      const values = views[accessor.bufferView];
      const view = new DataView(values.buffer, values.byteOffset, values.byteLength);
      const size = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5126: 4}[accessor.componentType];
      assert(size, "Unsupported position component");
      const read = (offset) => ({5120: () => view.getInt8(offset), 5121: () => view.getUint8(offset),
        5122: () => view.getInt16(offset, true), 5123: () => view.getUint16(offset, true), 5126: () => view.getFloat32(offset, true)})[accessor.componentType]();
      const stride = gltf.bufferViews[accessor.bufferView].byteStride ?? size * 3;
      for (let vertex = 0; vertex < accessor.count; vertex++) {
        const offset = (accessor.byteOffset ?? 0) + vertex * stride;
        const xyz = [read(offset), read(offset + size), read(offset + 2 * size)];
        box.expandByPoint(new Vector3(...(accessor.normalized ? decode(xyz) : xyz)).applyMatrix4(matrix));
      }
      count += gltf.accessors[primitive.indices].count / 3;
    }
    const { min, max } = source.bounds_blender;
    const expected = [[min[0], min[2], -max[1]], [max[0], max[2], -min[1]]];
    for (const [i, actual] of [box.min.toArray(), box.max.toArray()].entries())
      actual.forEach((value, axis) => assert(Math.abs(value - expected[i][axis]) < 0.0002, `Bounds: ${node.name}: ${value} vs ${expected[i][axis]}`));
    if (source.source_triangles) {
      assert(source.triangles <= source.source_triangles);
      assert(source.sampled_surface_error_m <= 0.003);
    }
    assert.equal(count, source.triangles, `Triangle count: ${node.name}`);
    triangles += count;
  }
  bytes += data.length;
  console.log(`PASS ${file}: ${nodes.length} meshes, ${data.length} bytes`);
}
if (!process.argv[2]) assert(seen.has("ROG_V2_Floor_Planks_AUTH") && seen.has("ROG_V2_Floor_Substrate"));
console.log(`TOTAL ${seen.size} unique meshes, ${triangles} triangles, ${bytes} bytes`);
