
import * as THREE from 'three';

/* ---------------- Coffee Mug Composite Object ---------------- */

export function buildCoffee() {
  const coffeeGroup = new THREE.Group();

  /* ---------------- Materials ---------------- */

  const mugRed = new THREE.MeshStandardMaterial({
    color: 0xb62935,
    roughness: 0.35,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  const saucerRed = new THREE.MeshStandardMaterial({
    color: 0x851d2b,
    roughness: 0.55,
    metalness: 0.02
  });

  const rimRed = new THREE.MeshStandardMaterial({
    color: 0xd3454f,
    roughness: 0.30,
    metalness: 0.04
  });

  const coffeeMat = new THREE.MeshStandardMaterial({
    color: 0x30170e,
    roughness: 0.55,
    metalness: 0.0
  });

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x976342,
    roughness: 0.85
  });

  /* ---------------- Helper ---------------- */

  function makeMesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /* ---------------- Saucer ---------------- */

  // Primitive 1: Cylinder - main plate
  
/* ---------------- Saucer ---------------- */

// Saucer with gently raised outer edges
  const saucerProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.95, 0.00),
    new THREE.Vector2(1.00, 0.04),
    new THREE.Vector2(0.98, 0.10),
    new THREE.Vector2(0.94, 0.13), // Raised outer edge
    new THREE.Vector2(0.88, 0.11),
    new THREE.Vector2(0.78, 0.075),
    new THREE.Vector2(0.65, 0.06),
    new THREE.Vector2(0.00, 0.06)
  ];

  const saucerBase = makeMesh(
    new THREE.LatheGeometry(saucerProfile, 64),
    saucerRed
  );

  coffeeGroup.add(saucerBase);


  // Primitive 2: Cylinder - shallow raised center
  const saucerCenter = makeMesh(
    new THREE.CylinderGeometry(0.68, 0.73, 0.025, 64),
    saucerRed
  );
  saucerCenter.position.y = 0.073;
  coffeeGroup.add(saucerCenter);

  // Primitive 3: Torus - decorative plate rim
  const saucerRim = makeMesh(
    new THREE.TorusGeometry(0.83, 0.025, 16, 64),
    rimRed
  );
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.position.y = 0.068;
  coffeeGroup.add(saucerRim);

  /* ---------------- Cup Foot ---------------- */

  // Primitive 4: Cylinder
  const cupFoot = makeMesh(
    new THREE.CylinderGeometry(0.27, 0.30, 0.09, 48),
    mugRed
  );
  cupFoot.position.y = 0.14;
  coffeeGroup.add(cupFoot);

  /* ---------------- Hollow Coffee Cup ---------------- */

  // Use a lathe profile to make a hollow ceramic cup.
  // Unlike a solid cylinder, this has an open top.
  // The profile describes the outer and inner walls.

  const cupProfile = [
    // Bottom and outside of cup
    new THREE.Vector2(0.00, 0.18),
    new THREE.Vector2(0.27, 0.18),
    new THREE.Vector2(0.36, 0.22),
    new THREE.Vector2(0.43, 0.30),
    new THREE.Vector2(0.49, 0.43),
    new THREE.Vector2(0.54, 0.59),
    new THREE.Vector2(0.56, 0.76),
    new THREE.Vector2(0.55, 0.86),

    // Rounded upper lip
    new THREE.Vector2(0.53, 0.90),
    new THREE.Vector2(0.49, 0.92),
    new THREE.Vector2(0.46, 0.90),

    // Inside of cup
    new THREE.Vector2(0.45, 0.86),
    new THREE.Vector2(0.46, 0.76),
    new THREE.Vector2(0.43, 0.59),
    new THREE.Vector2(0.38, 0.43),
    new THREE.Vector2(0.31, 0.31),
    new THREE.Vector2(0.22, 0.25),
    new THREE.Vector2(0.00, 0.25)
  ];

  const cupBody = makeMesh(
    new THREE.LatheGeometry(cupProfile, 64),
    mugRed
  );

  coffeeGroup.add(cupBody);

  /* ---------------- Mug Rim ---------------- */

  // Primitive 5: Torus
  const cupRim = makeMesh(
    new THREE.TorusGeometry(0.495, 0.026, 16, 64),
    rimRed
  );
  cupRim.rotation.x = Math.PI / 2;
  cupRim.position.y = 0.905;
  coffeeGroup.add(cupRim);

  /* ---------------- Dark Brown Coffee ---------------- */

  // Primitive 6: Cylinder
  // Coffee is placed just below the cup rim.
  // The cup is hollow so the liquid remains visible.

  const coffeeSurface = makeMesh(
    new THREE.CylinderGeometry(0.452, 0.452, 0.012, 64),
    coffeeMat
  );

  coffeeSurface.position.y = 0.835;
  coffeeSurface.castShadow = false;
  coffeeGroup.add(coffeeSurface);

  /* ---------------- Small Coffee Bubbles ---------------- */

  // Primitive 7: Sphere
  const bubble1 = makeMesh(
    new THREE.SphereGeometry(0.025, 16, 12),
    foamMat
  );

  bubble1.scale.set(1.4, 0.15, 1);
  bubble1.position.set(-0.18, 0.845, 0.10);
  bubble1.castShadow = false;
  coffeeGroup.add(bubble1);

  // Primitive 8: Sphere
  const bubble2 = makeMesh(
    new THREE.SphereGeometry(0.018, 16, 12),
    foamMat
  );

  bubble2.scale.set(1.2, 0.15, 1);
  bubble2.position.set(-0.12, 0.845, 0.16);
  bubble2.castShadow = false;
  coffeeGroup.add(bubble2);

  /* ---------------- Curved Mug Handle ---------------- */

  // A single smooth handle instead of a detached torus.
  // It starts inside the mug's upper wall, curves outward,
  // and reconnects to the mug near the bottom.

  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.49, 0.77, 0.00),
    new THREE.Vector3(0.64, 0.82, 0.00),
    new THREE.Vector3(0.83, 0.82, 0.00),
    new THREE.Vector3(1.01, 0.75, 0.00),
    new THREE.Vector3(1.10, 0.62, 0.00),
    new THREE.Vector3(1.10, 0.51, 0.00),
    new THREE.Vector3(1.02, 0.39, 0.00),
    new THREE.Vector3(0.84, 0.32, 0.00),
    new THREE.Vector3(0.65, 0.32, 0.00),
    new THREE.Vector3(0.47, 0.39, 0.00)
  ]);

  // Primitive 9: TubeGeometry
  const handle = makeMesh(
    new THREE.TubeGeometry(
      handleCurve,
      80,
      0.052,
      16,
      false
    ),
    mugRed
  );

  coffeeGroup.add(handle);

  /* ---------------- Presentation ---------------- */

  // Slight rotation makes the handle easier to see.
  coffeeGroup.rotation.y = -0.20;

  return coffeeGroup;
}
