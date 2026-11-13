// Composite object: table lamp (cylinder, sphere, torus, cone primitives)
// Polygonal mesh object: fern (custom BufferGeometry)

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildLamp } from './table_lamp.js';
import { buildFern } from './potted_fern.js';

/* ---------------- Scene / Renderer / Camera ---------------- */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8b9aa6);

// Orthographic camera: VIEW_H = world units visible top to bottom
const VIEW_H = 1.0;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -VIEW_H * aspect / 2, VIEW_H * aspect / 2, VIEW_H / 2, -VIEW_H / 2, 0.01, 20
);
camera.position.set(1.3, 0.75, 1.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.24, 0);
controls.enableDamping = true;

/* ---------------- Lights & Ground ---------------- */
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x5a4636, 1.0));
const key = new THREE.DirectionalLight(0xcfdcea, 1.6);
key.position.set(-1.5, 2.0, -1.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -1; key.shadow.camera.right = 1;
key.shadow.camera.top = 1;   key.shadow.camera.bottom = -1;
key.shadow.bias = -0.0005;
scene.add(key);

// Windowsill and wall
const sill = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.04, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.7 })
);
sill.position.y = -0.02; // top surface at y = 0
sill.receiveShadow = true;
scene.add(sill);

const wall = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 1.2, 0.04),
  new THREE.MeshStandardMaterial({ color: 0xe9dcc6, roughness: 0.95 })
);
wall.position.set(0, 0.6, -0.32);
wall.receiveShadow = true;
scene.add(wall);

/* ---------------- Objects ---------------- */
const lamp = buildLamp();
lamp.position.set(-0.28, 0, -0.05);
scene.add(lamp);

const fern = buildFern();
fern.position.set(0.12, 0, 0);
scene.add(fern);

/* ---------------- Resize & Render ---------------- */
function onResize() {
  const a = window.innerWidth / window.innerHeight;
  camera.left = -VIEW_H * a / 2;
  camera.right = VIEW_H * a / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
