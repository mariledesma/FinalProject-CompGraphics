
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildCoffee } from './coffee.js';

/* ---------------- Scene / Renderer / Camera ---------------- */

const canvas = document.getElementById('c');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1eeea);

// Orthographic projection (required)
const camera = new THREE.OrthographicCamera(
  -1, 1, 1, -1, 0.1, 100
);

camera.position.set(5.4, 4.5, 7.4);

/* ---------------- Camera Controls ---------------- */

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.20, 0.42, 0.00);
controls.enableDamping = true;
controls.enablePan = false;
controls.update();

/* ---------------- Lighting ---------------- */

scene.add(new THREE.HemisphereLight(
  0xffffff, 0xcbb9a7, 1.15
));

const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(5, 8, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
scene.add(key);

/* ---------------- Ground ---------------- */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: 0xe8e3dc,
    roughness: 0.95
  })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ============================================================
   CUSTOM POLYGONAL MESH OBJECT: SLEEPING ORANGE CAT
   ============================================================ */

function buildCat() {

  const cat = new THREE.Group();

  /* ---------------- Materials ---------------- */

  const fur = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    flatShading: false,
    side: THREE.DoubleSide
  });

  const orange = new THREE.MeshStandardMaterial({
    color: 0xf3a052,
    roughness: 0.9,
    side: THREE.DoubleSide
  });

  const pink = new THREE.MeshStandardMaterial({
    color: 0xd99482,
    roughness: 0.9,
    side: THREE.DoubleSide
  });

  const dark = new THREE.MeshBasicMaterial({
    color: 0x66402c,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const nosePink = new THREE.MeshBasicMaterial({
    color: 0xd58a82,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const padMaterial = new THREE.MeshStandardMaterial({
    color: 0xc98270,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  const furColor = new THREE.Color(0xf2a04e);
  const lightColor = new THREE.Color(0xffd09a);
  const creamColor = new THREE.Color(0xffe1bb);

  const clamp = THREE.MathUtils.clamp;

  /* ---------------- Mesh Helpers ---------------- */

  // Create indexed custom polygon geometry.
  function meshFromData(vertices, indices, material, colors = null) {

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    geometry.setIndex(indices);

    if (colors) {
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
      );
    }

    // Smooth lighting across connected polygon faces.
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  function addColor(colors, color) {
    colors.push(color.r, color.g, color.b);
  }

  /* ---------------- Curved Polygon Mesh Helper ---------------- */

  // Builds a custom 3D mesh along a curved path.
  // Each cross-section has its own width and height.
  // Optional belly coloring changes the underside of the mesh.
  function curvedBody(
    sections,
    steps = 48,
    sides = 24,
    belly = false
  ) {

    const vertices = [];
    const indices = [];
    const colors = [];

    const points = sections.map(s =>
      new THREE.Vector3(s.x, s.y, s.z)
    );

    const curve = new THREE.CatmullRomCurve3(points);

    function dimensions(t) {

      const value = t * (sections.length - 1);

      const i = Math.min(
        Math.floor(value),
        sections.length - 2
      );

      let f = value - i;
      f = f * f * (3 - 2 * f);

      const a = sections[i];
      const b = sections[i + 1];

      return {
        w: THREE.MathUtils.lerp(a.w, b.w, f),
        h: THREE.MathUtils.lerp(a.h, b.h, f)
      };
    }

    /* ---------- Create Rings of Vertices ---------- */

    for (let i = 0; i <= steps; i++) {

      const t = i / steps;

      const center = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const size = dimensions(t);

      const length = Math.hypot(
        tangent.x,
        tangent.z
      ) || 1;

      const sx = -tangent.z / length;
      const sz = tangent.x / length;

      for (let j = 0; j < sides; j++) {

        const a = 2 * Math.PI * j / sides;

        const horizontal = Math.cos(a);
        const vertical = Math.sin(a);

        const x = center.x + sx * size.w * horizontal;
        const y = center.y + size.h * vertical;
        const z = center.z + sz * size.w * horizontal;

        vertices.push(x, y, z);

        /* ---------- Fur Shading ---------- */

        const variation =
          0.12 +
          0.09 * Math.sin(t * 13 + a * 3) +
          0.05 * Math.cos(t * 23 - a * 2);

        const shade = clamp(
          variation + Math.max(0, vertical) * 0.10,
          0.02,
          0.35
        );

        const color = furColor.clone().lerp(
          lightColor,
          shade
        );

        // Cream-colored underside for the main body.
        if (belly && vertical < -0.15) {

          const amount = THREE.MathUtils.smoothstep(
            -vertical,
            0.15,
            0.95
          );

          color.lerp(
            creamColor,
            amount * 0.65
          );
        }

        addColor(colors, color);
      }
    }

    /* ---------- Connect Rings with Triangle Faces ---------- */

    for (let i = 0; i < steps; i++) {

      for (let j = 0; j < sides; j++) {

        const k = (j + 1) % sides;

        const a = i * sides + j;
        const b = i * sides + k;
        const c = (i + 1) * sides + j;
        const d = (i + 1) * sides + k;

        indices.push(a, c, d);
        indices.push(a, d, b);
      }
    }

    /* ---------- Close Mesh Ends ---------- */

    const start = sections[0];
    const end = sections[sections.length - 1];

    const startIndex = vertices.length / 3;

    vertices.push(start.x, start.y, start.z);
    addColor(colors, furColor);

    const endIndex = vertices.length / 3;

    vertices.push(end.x, end.y, end.z);
    addColor(colors, furColor);

    for (let j = 0; j < sides; j++) {

      const k = (j + 1) % sides;

      indices.push(startIndex, j, k);

      const last = steps * sides;

      indices.push(
        endIndex,
        last + k,
        last + j
      );
    }

    return meshFromData(
      vertices,
      indices,
      fur,
      colors
    );
  }

  /* ---------------- Rounded Sleeping Body ---------------- */

  // Wide rounded body with a broad shoulder.
  // Neck extends into the head to prevent a visible gap.

  cat.add(curvedBody([
    { x: -1.03, y: 0.32, z: -0.05, w: 0.04, h: 0.06 },
    { x: -0.96, y: 0.40, z: -0.23, w: 0.33, h: 0.29 },
    { x: -0.75, y: 0.44, z: -0.33, w: 0.49, h: 0.36 },
    { x: -0.47, y: 0.44, z: -0.32, w: 0.52, h: 0.37 },
    { x: -0.19, y: 0.40, z: -0.23, w: 0.45, h: 0.33 },

    // Shoulder
    { x:  0.05, y: 0.35, z:  0.02, w: 0.37, h: 0.28 },

    // Neck overlaps the head
    { x:  0.23, y: 0.33, z:  0.27, w: 0.28, h: 0.23 },
    { x:  0.34, y: 0.33, z:  0.43, w: 0.06, h: 0.08 }

  ], 64, 32, true));

  /* ---------------- Curled Tail ---------------- */

  // Tail starts within the hindquarters and wraps
  // closely along the front edge of the body.

  cat.add(curvedBody([
    { x: -0.89, y: 0.34, z: -0.16, w: 0.04, h: 0.05 },
    { x: -1.06, y: 0.28, z: -0.04, w: 0.12, h: 0.13 },
    { x: -1.11, y: 0.22, z:  0.17, w: 0.15, h: 0.14 },
    { x: -0.99, y: 0.18, z:  0.35, w: 0.17, h: 0.15 },
    { x: -0.79, y: 0.15, z:  0.46, w: 0.17, h: 0.15 },
    { x: -0.53, y: 0.15, z:  0.48, w: 0.17, h: 0.14 },
    { x: -0.27, y: 0.15, z:  0.50, w: 0.15, h: 0.13 },
    { x: -0.06, y: 0.16, z:  0.54, w: 0.05, h: 0.06 }

  ], 64, 24));

  /* ---------------- Custom Rounded Mesh Helper ---------------- */

  // Creates a rounded 3D shape using custom vertices,
  // indexed triangles, and smooth normals.

  function organicOval(
    cx, cy, cz,
    rx, ry, rz,
    isHead = false
  ) {

    const vertices = [];
    const indices = [];
    const colors = [];

    const lat = 24;
    const lon = 36;

    // Top pole
    vertices.push(cx, cy + ry, cz);
    addColor(colors, furColor);

    /* ---------- Build Vertex Rings ---------- */

    for (let i = 1; i < lat; i++) {

      const theta = Math.PI * i / lat;

      for (let j = 0; j < lon; j++) {

        const phi = 2 * Math.PI * j / lon;
        const st = Math.sin(theta);

        const x = cx + rx * st * Math.cos(phi);
        const y = cy + ry * Math.cos(theta);
        const z = cz + rz * st * Math.sin(phi);

        vertices.push(x, y, z);

        /* ---------- Fur Coloring ---------- */

        const front = clamp(
          (z - cz - 0.08) / (rz * 0.55),
          0, 1
        );

        const lower = clamp(
          (cy + 0.07 - y) / (ry * 0.55),
          0, 1
        );

        const bottomFade = clamp(
          (y - (cy - ry * 0.85)) / (ry * 0.30),
          0, 1
        );

        const variation =
          0.10 +
          0.05 * Math.sin(phi * 5 + theta * 4);

        const color = furColor.clone().lerp(
          lightColor,
          clamp(variation, 0, 0.3)
        );

        // Soft cream coloring near the muzzle.
        if (isHead) {

          color.lerp(
            creamColor,
            front * lower * bottomFade * 0.75
          );
        }

        addColor(colors, color);
      }
    }

    /* ---------- Bottom Pole ---------- */

    const bottomIndex = vertices.length / 3;

    vertices.push(cx, cy - ry, cz);
    addColor(colors, furColor);

    /* ---------- Top Faces ---------- */

    for (let j = 0; j < lon; j++) {

      const k = (j + 1) % lon;

      indices.push(
        0,
        1 + k,
        1 + j
      );
    }

    /* ---------- Middle Faces ---------- */

    for (let i = 0; i < lat - 2; i++) {

      for (let j = 0; j < lon; j++) {

        const k = (j + 1) % lon;

        const a = 1 + i * lon + j;
        const b = 1 + i * lon + k;
        const c = 1 + (i + 1) * lon + k;
        const d = 1 + (i + 1) * lon + j;

        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }

    /* ---------- Bottom Faces ---------- */

    const lastRing = 1 + (lat - 2) * lon;

    for (let j = 0; j < lon; j++) {

      const k = (j + 1) % lon;

      indices.push(
        lastRing + j,
        lastRing + k,
        bottomIndex
      );
    }

    return meshFromData(
      vertices,
      indices,
      fur,
      colors
    );
  }

  /* ---------------- Front Paws ---------------- */

  // Small paws tucked beneath the face.

  cat.add(organicOval(
    0.17, 0.12, 0.62,
    0.18, 0.105, 0.15
  ));

  cat.add(organicOval(
    0.46, 0.12, 0.63,
    0.18, 0.105, 0.15
  ));

  /* ---------------- Hind Paws ---------------- */

  // Rounded hind paws partially hidden by the body.

  cat.add(organicOval(
    -0.82, 0.15, -0.05,
    0.22, 0.135, 0.22
  ));

  cat.add(organicOval(
    -0.48, 0.14, 0.16,
    0.20, 0.13, 0.19
  ));

  /* ---------------- Underside Paw Pads ---------------- */

  // Each pad is a custom polygon mesh.
  // Pads face downward so they appear from underneath.

  function addPawPad(x, y, z, rx, rz) {

    const vertices = [x, y, z];
    const indices = [];

    const segments = 16;

    for (let i = 0; i < segments; i++) {

      const angle = 2 * Math.PI * i / segments;

      vertices.push(
        x + Math.cos(angle) * rx,
        y,
        z + Math.sin(angle) * rz
      );
    }

    for (let i = 0; i < segments; i++) {

      indices.push(
        0,
        i + 1,
        ((i + 1) % segments) + 1
      );
    }

    const pad = meshFromData(
      vertices,
      indices,
      padMaterial
    );

    pad.castShadow = false;
    cat.add(pad);
  }

  // Paw locations on the underside.
  const paws = [
    { x: -0.82, y: 0.010, z: -0.05 },
    { x: -0.48, y: 0.006, z:  0.16 },
    { x:  0.17, y: 0.010, z:  0.62 },
    { x:  0.46, y: 0.010, z:  0.63 }
  ];

  for (const paw of paws) {

    // Main paw pad
    addPawPad(
      paw.x,
      paw.y,
      paw.z,
      0.085,
      0.075
    );

    // Three small toe pads
    for (let i = -1; i <= 1; i++) {

      addPawPad(
        paw.x + i * 0.055,
        paw.y - 0.001,
        paw.z + 0.085,
        0.023,
        0.029
      );
    }
  }

  /* ---------------- Sleeping Head ---------------- */

  const headCenter = {
    x: 0.35,
    y: 0.38,
    z: 0.45,
    rx: 0.38,
    ry: 0.31,
    rz: 0.315
  };

  // Head overlaps the neck and rests close to the paws.
  cat.add(organicOval(
    headCenter.x,
    headCenter.y,
    headCenter.z,
    headCenter.rx,
    headCenter.ry,
    headCenter.rz,
    true
  ));

  /* ---------------- Polygonal Ears ---------------- */

  // Each ear consists of manually defined triangle faces.

  function createEar(x, lean = 0) {

    const vertices = [
      x - 0.12, 0.61, 0.52,
      x + 0.12, 0.61, 0.52,
      x + lean, 0.94, 0.45,

      x - 0.12, 0.61, 0.38,
      x + 0.12, 0.61, 0.38,
      x + lean, 0.94, 0.38
    ];

    const indices = [
      0, 1, 2,
      3, 5, 4,
      0, 3, 4,
      0, 4, 1,
      1, 4, 5,
      1, 5, 2,
      2, 5, 3,
      2, 3, 0
    ];

    cat.add(meshFromData(
      vertices,
      indices,
      orange
    ));

    /* ---------- Inner Ear ---------- */

    const innerVertices = [
      x - 0.075, 0.65, 0.527,
      x + 0.075, 0.65, 0.527,
      x + lean, 0.85, 0.49
    ];

    cat.add(meshFromData(
      innerVertices,
      [0, 1, 2],
      pink
    ));
  }

  createEar(0.12, -0.04);
  createEar(0.60, 0.04);

  /* ---------------- Face Geometry Helpers ---------------- */

  // Calculate where the head's front surface is.
  // Facial features follow the rounded head.

  function faceZ(x, y) {

    const h = headCenter;

    const dx = (x - h.x) / h.rx;
    const dy = (y - h.y) / h.ry;

    return h.z + h.rz * Math.sqrt(
      Math.max(0.001, 1 - dx * dx - dy * dy)
    ) + 0.014;
  }

  // Custom polygon strips for eyes and mouth.
  function faceLine(points, width, material) {

    const vertices = [];
    const indices = [];

    for (let i = 0; i < points.length; i++) {

      const previous = points[Math.max(i - 1, 0)];
      const next = points[Math.min(i + 1, points.length - 1)];

      const dx = next[0] - previous[0];
      const dy = next[1] - previous[1];

      const length = Math.hypot(dx, dy) || 1;

      const nx = -dy / length * width / 2;
      const ny = dx / length * width / 2;

      const [x, y] = points[i];

      vertices.push(
        x + nx, y + ny, faceZ(x + nx, y + ny),
        x - nx, y - ny, faceZ(x - nx, y - ny)
      );
    }

    for (let i = 0; i < points.length - 1; i++) {

      const a = i * 2;

      indices.push(
        a, a + 1, a + 3,
        a, a + 3, a + 2
      );
    }

    const line = meshFromData(
      vertices,
      indices,
      material
    );

    line.castShadow = false;
    cat.add(line);
  }

  /* ---------------- Closed Sleeping Eyes ---------------- */

  // Gentle curved lines instead of sharp cartoon eyes.

  faceLine([
    [0.09, 0.40],
    [0.15, 0.37],
    [0.20, 0.36],
    [0.25, 0.39]
  ], 0.012, dark);

  faceLine([
    [0.45, 0.39],
    [0.50, 0.36],
    [0.55, 0.37],
    [0.61, 0.40]
  ], 0.012, dark);

  /* ---------------- Pink Nose ---------------- */

  const nosePoints = [
    [0.305, 0.26],
    [0.395, 0.26],
    [0.35, 0.215]
  ];

  const noseVertices = [];

  for (const [x, y] of nosePoints) {

    noseVertices.push(
      x,
      y,
      faceZ(x, y) + 0.008
    );
  }

  const nose = meshFromData(
    noseVertices,
    [0, 1, 2],
    nosePink
  );

  nose.castShadow = false;
  cat.add(nose);

  /* ---------------- Small Sleeping Mouth ---------------- */

  faceLine([
    [0.35, 0.215],
    [0.33, 0.19],
    [0.29, 0.20]
  ], 0.009, dark);

  faceLine([
    [0.35, 0.215],
    [0.37, 0.19],
    [0.41, 0.20]
  ], 0.009, dark);

  /* ---------------- Finished Cat ---------------- */

  return cat;
}

/* ============================================================
   ADD BOTH OBJECTS TO SCENE
   ============================================================ */

// Custom polygonal mesh cat
const cat = buildCat();

cat.position.set(-1.35, 0, 0.05);
cat.rotation.y = -0.22;

scene.add(cat);

// Composite primitive coffee mug
const coffee = buildCoffee();

coffee.position.set(1.70, 0, 0.02);
coffee.scale.set(0.95, 0.95, 0.95);

scene.add(coffee);

/* ---------------- Resize / Render ---------------- */

const FRUSTUM_HEIGHT = 4.8;

function onResize() {

  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  camera.left = -FRUSTUM_HEIGHT * aspect / 2;
  camera.right = FRUSTUM_HEIGHT * aspect / 2;
  camera.top = FRUSTUM_HEIGHT / 2;
  camera.bottom = -FRUSTUM_HEIGHT / 2;

  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener('resize', onResize);

onResize();

/* ---------------- Animation Loop ---------------- */

renderer.setAnimationLoop(() => {

  controls.update();
  renderer.render(scene, camera);

});
