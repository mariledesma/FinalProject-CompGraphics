// Fern — custom polygonal mesh object (single hand-built BufferGeometry)

import * as THREE from 'three';

/* ---------------- Materials ---------------- */
const clay = new THREE.MeshStandardMaterial({ color: 0xb5603a, roughness: 0.85 });
const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 1 });
const fernMat = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.65, side: THREE.DoubleSide, flatShading: true
});

/* ---------------- Helpers ---------------- */
function part(geo, mat, x, y, z) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Simple seeded random so the fern is the same on every load
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ---------------- Fern (custom polygonal mesh) ---------------- */
// Each frond = curved stem (Bezier) + pairs of folded leaflets that shrink toward the tip.
// All triangles go into ONE BufferGeometry.
function buildFernGeometry(fronds = 16, seed = 7) {
  const rand = seededRandom(seed);
  const positions = [];
  const colors = [];

  const baseC = new THREE.Color(0x2f5a24); // dark green near stem
  const tipC = new THREE.Color(0x8cbf4a);  // light green at tips
  const stemC = new THREE.Color(0x4d6b2a);

  // Add one triangle with a color per corner
  function tri(a, b, c, ca, cb, cc) {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    colors.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
  }

  const up = new THREE.Vector3(0, 1, 0);
  const STEPS = 22; // samples along each frond

  for (let f = 0; f < fronds; f++) {
    // Per-frond direction, reach, arch height, droop, leaflet size
    const angle = (f / fronds) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-dir.z, 0, dir.x); // perpendicular to dir
    const L = 0.22 + rand() * 0.10;
    const H = 0.12 + rand() * 0.10;
    const droop = -0.04 - rand() * 0.10;
    const leafMax = 0.05 + rand() * 0.015;

    // Quadratic Bezier stem: P(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
    const P0 = new THREE.Vector3(dir.x * 0.01, 0, dir.z * 0.01);
    const P1 = dir.clone().multiplyScalar(L * 0.25).addScaledVector(up, H);
    const P2 = dir.clone().multiplyScalar(L).addScaledVector(up, H * 0.35 + droop);
    const point = (t) => new THREE.Vector3()
      .addScaledVector(P0, (1 - t) * (1 - t))
      .addScaledVector(P1, 2 * (1 - t) * t)
      .addScaledVector(P2, t * t);
    const tangent = (t) => new THREE.Vector3() // derivative of P(t)
      .addScaledVector(P1.clone().sub(P0), 2 * (1 - t))
      .addScaledVector(P2.clone().sub(P1), 2 * t)
      .normalize();

    for (let i = 0; i < STEPS; i++) {
      const t0 = i / STEPS, t1 = (i + 1) / STEPS;
      const A = point(t0), B = point(t1);
      const T = tangent(t0);
      const N = new THREE.Vector3().crossVectors(side, T).normalize(); // frond "up" face

      // Stem segment: thin tapering strip (2 triangles)
      const w0 = 0.004 * (1 - t0) + 0.001, w1 = 0.004 * (1 - t1) + 0.001;
      const a1 = A.clone().addScaledVector(side, w0), a2 = A.clone().addScaledVector(side, -w0);
      const b1 = B.clone().addScaledVector(side, w1), b2 = B.clone().addScaledVector(side, -w1);
      tri(a1, b1, a2, stemC, stemC, stemC);
      tri(a2, b1, b2, stemC, stemC, stemC);

      // Leaflets start after a short bare stem
      if (t0 < 0.15) continue;
      const tl = (t0 - 0.15) / 0.85; // 0..1 along the leafy part
      const len = leafMax * Math.sin(Math.PI * (0.25 + 0.75 * tl)) * (1 - 0.6 * tl);
      if (len < 0.004) continue;
      const wid = len * 0.42;

      for (const s of [1, -1]) { // left and right leaflet
        // Points sideways, sweeps toward the tip, droops slightly
        const D = side.clone().multiplyScalar(s).addScaledVector(T, 0.45).addScaledVector(N, -0.2).normalize();
        const W = new THREE.Vector3().crossVectors(D, N).normalize().multiplyScalar(wid / 2);

        const tip = A.clone().addScaledVector(D, len);
        const mid = A.clone().addScaledVector(D, len * 0.42);
        const rib = mid.clone().addScaledVector(N, wid * 0.35); // raised midrib -> V fold
        const e1 = mid.clone().add(W);
        const e2 = mid.clone().sub(W);

        const cRoot = baseC.clone().lerp(tipC, 0.15 * tl);
        const cTip = baseC.clone().lerp(tipC, 0.55 + 0.45 * tl);
        const cMid = cRoot.clone().lerp(cTip, 0.5);

        // Folded diamond = 4 triangles
        tri(A, rib, e1, cRoot, cMid, cMid);
        tri(rib, tip, e1, cMid, cTip, cMid);
        tri(A, e2, rib, cRoot, cMid, cMid);
        tri(rib, e2, tip, cMid, cMid, cTip);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function buildFern() {
  const g = new THREE.Group();

  // Pot (holder only; the fern foliage is the mesh object)
  g.add(part(new THREE.CylinderGeometry(0.075, 0.055, 0.11, 40), clay, 0, 0.055, 0));
  g.add(part(new THREE.CylinderGeometry(0.084, 0.08, 0.025, 40), clay, 0, 0.11, 0));
  g.add(part(new THREE.CylinderGeometry(0.072, 0.072, 0.01, 40), soilMat, 0, 0.118, 0));

  const fern = new THREE.Mesh(buildFernGeometry(), fernMat);
  fern.position.y = 0.12;
  fern.castShadow = true;
  fern.receiveShadow = true;
  g.add(fern);

  return g;
}
