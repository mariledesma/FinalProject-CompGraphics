// Table Lamp — composite object built from 3D primitives
// Primitive types: Cylinder, Sphere, Torus, Cone

import * as THREE from 'three';

/* ---------------- Materials ---------------- */
const brass = new THREE.MeshStandardMaterial({ color: 0xc9973f, metalness: 0.55, roughness: 0.32 });
const darkBrass = new THREE.MeshStandardMaterial({ color: 0x8a6228, metalness: 0.55, roughness: 0.4 });
const shadeMat = new THREE.MeshStandardMaterial({
  color: 0xf3e2bf, roughness: 0.9, side: THREE.DoubleSide,
  emissive: 0xffc77a, emissiveIntensity: 0.55 // shade glows from the bulb
});
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe2a8, emissiveIntensity: 2.0 });

/* ---------------- Helpers ---------------- */
function part(geo, mat, x, y, z) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ---------------- Table Lamp (composite of primitives) ---------------- */
export function buildLamp() {
  const g = new THREE.Group();

  // Base: flat cylinder + half sphere dome + torus collar
  g.add(part(new THREE.CylinderGeometry(0.085, 0.095, 0.02, 48), brass, 0, 0.01, 0));
  g.add(part(new THREE.SphereGeometry(0.07, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), brass, 0, 0.02, 0));
  const collar = part(new THREE.TorusGeometry(0.022, 0.007, 16, 40), darkBrass, 0, 0.085, 0);
  collar.rotation.x = Math.PI / 2;
  g.add(collar);

  // Stem: lower cylinder, sphere knob, upper cylinder
  g.add(part(new THREE.CylinderGeometry(0.011, 0.014, 0.13, 24), brass, 0, 0.15, 0));
  g.add(part(new THREE.SphereGeometry(0.026, 32, 16), brass, 0, 0.23, 0));
  g.add(part(new THREE.CylinderGeometry(0.009, 0.011, 0.09, 24), brass, 0, 0.30, 0));

  // Socket (cone, point down) and bulb (sphere)
  const socket = part(new THREE.ConeGeometry(0.024, 0.035, 24), darkBrass, 0, 0.36, 0);
  socket.rotation.x = Math.PI;
  g.add(socket);
  g.add(part(new THREE.SphereGeometry(0.03, 32, 16), bulbMat, 0, 0.39, 0));

  // Shade: open tapered cylinder with torus trim at top and bottom
  const shadeH = 0.17, shadeBot = 0.155, shadeTop = 0.085, shadeY = 0.41;
  const shade = part(new THREE.CylinderGeometry(shadeTop, shadeBot, shadeH, 64, 1, true), shadeMat, 0, shadeY, 0);
  shade.castShadow = false; // let the bulb light out
  g.add(shade);
  const rimBot = part(new THREE.TorusGeometry(shadeBot, 0.004, 10, 64), darkBrass, 0, shadeY - shadeH / 2, 0);
  rimBot.rotation.x = Math.PI / 2;
  const rimTop = part(new THREE.TorusGeometry(shadeTop, 0.004, 10, 64), darkBrass, 0, shadeY + shadeH / 2, 0);
  rimTop.rotation.x = Math.PI / 2;
  g.add(rimBot, rimTop);

  // Harp: saddle under the socket, two rods up past the bulb, arch over the top
  const harpR = 0.045, harpBot = 0.345, harpTop = shadeY + shadeH / 2 - harpR; // arch peaks at the top rim
  const saddle = part(new THREE.CylinderGeometry(0.003, 0.003, harpR * 2, 8), darkBrass, 0, harpBot, 0);
  saddle.rotation.z = Math.PI / 2;
  g.add(saddle);
  for (const x of [-harpR, harpR]) {
    g.add(part(new THREE.CylinderGeometry(0.003, 0.003, harpTop - harpBot, 8), darkBrass, x, (harpBot + harpTop) / 2, 0));
  }
  g.add(part(new THREE.TorusGeometry(harpR, 0.003, 8, 32, Math.PI), darkBrass, 0, harpTop, 0)); // half torus = arch

  // Spider: 3 spokes joining the top of the harp to the shade's top rim
  for (let i = 0; i < 3; i++) {
    const spoke = part(new THREE.CylinderGeometry(0.002, 0.002, shadeTop, 8), darkBrass, shadeTop / 2, 0, 0);
    spoke.rotation.z = Math.PI / 2;
    const pivot = new THREE.Group();
    pivot.position.y = shadeY + shadeH / 2;
    pivot.rotation.y = i * Math.PI * 2 / 3 + Math.PI / 2;
    pivot.add(spoke);
    g.add(pivot);
  }
  g.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 20), darkBrass, 0, shadeY + shadeH / 2, 0)); // center washer

  // Finial: cone + small sphere, sitting on the washer
  g.add(part(new THREE.ConeGeometry(0.012, 0.03, 20), brass, 0, shadeY + shadeH / 2 + 0.015, 0));
  g.add(part(new THREE.SphereGeometry(0.01, 16, 12), brass, 0, shadeY + shadeH / 2 + 0.035, 0));

  // Warm bulb light
  const bulbLight = new THREE.PointLight(0xffc46b, 0.22, 0, 2);
  bulbLight.position.set(0, 0.39, 0);
  g.add(bulbLight);

  return g;
}
