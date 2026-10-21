import * as THREE from 'three';

export interface VehicleMeshBundle {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  exhaustTip: THREE.Vector3;
  bladeMesh: THREE.Group;
  headlightL: THREE.PointLight;
  headlightR: THREE.PointLight;
  bladeMaterial: THREE.MeshStandardMaterial;
  bodyMaterial: THREE.MeshStandardMaterial;
  stripeMesh?: THREE.Mesh;
  decalMesh?: THREE.Mesh;
  updateCustomization: (bodyColorKey: string, bladeColorKey: string, decalId: string) => void;
}

export const COLOR_SCHEMES: Record<string, { hex: number; name: string }> = {
  'nordic-red': { hex: 0xd9383a, name: 'Nordic Crimson' },
  'tangerine': { hex: 0xf26419, name: 'Amber Blaze' },
  'aurora-teal': { hex: 0x17c3b2, name: 'Aurora Teal' },
  'golden-legend': { hex: 0xfbc531, name: 'Golden Legend' },
  'minty': { hex: 0x00b894, name: 'Alpine Mint' },
  'midnight': { hex: 0x2c3e50, name: 'Midnight Frost' },
  'sunset-coral': { hex: 0xff6b6b, name: 'Sunset Coral' },
  'royal-violet': { hex: 0x6c5ce7, name: 'Royal Violet' },
};

export const BLADE_COLORS: Record<string, { hex: number; name: string }> = {
  'gold': { hex: 0xf39c12, name: 'Safety Gold' },
  'chrome': { hex: 0xdcdde1, name: 'Polished Chrome' },
  'crimson': { hex: 0xc0392b, name: 'Heavy Crimson' },
  'cyan': { hex: 0x00cec9, name: 'Neon Ice' },
  'obsidian': { hex: 0x2d3436, name: 'Obsidian Black' },
};

export const PLOW_DECALS = [
  { id: 'none', name: 'Clean Solid', desc: 'Sleek minimalist industrial paintwork', icon: '✨', unlockedAtReputation: 0 },
  { id: 'racing-stripes', name: 'Rally Stripes', desc: 'Twin aerodynamic speed stripes', icon: '🏁', unlockedAtReputation: 15 },
  { id: 'snowflakes', name: 'Winter Crystals', desc: 'Intricate frosted snowflake badges', icon: '❄️', unlockedAtReputation: 35 },
  { id: 'hazard', name: 'Hazard Chevrons', desc: 'High-vis industrial caution chevrons', icon: '⚠️', unlockedAtReputation: 55 },
  { id: 'peaks', name: 'Alpine Peaks', desc: 'Silhouette of snow-capped mountain ranges', icon: '🏔️', unlockedAtReputation: 75 },
  { id: 'flame-blizzard', name: 'Frostbite Flames', desc: 'Blazing icy aerodynamic fire trails', icon: '🔥', unlockedAtReputation: 90 },
];

/**
 * Creates dynamic procedural decal texture for the truck cabin roof and sides
 */
function createDecalTexture(decalId: string, baseHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fill transparent base
  ctx.clearRect(0, 0, 256, 256);

  if (decalId === 'racing-stripes') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(92, 0, 28, 256);
    ctx.fillRect(136, 0, 28, 256);
    // Subtle accent pin-lines
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(84, 0, 4, 256);
    ctx.fillRect(168, 0, 4, 256);
  } else if (decalId === 'snowflakes') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const drawSnowflake = (cx: number, cy: number, r: number) => {
      for (let a = 0; a < 6; a++) {
        const rad = (a * Math.PI) / 3;
        const x2 = cx + Math.cos(rad) * r;
        const y2 = cy + Math.sin(rad) * r;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // mini branches
        const bX = cx + Math.cos(rad) * (r * 0.6);
        const bY = cy + Math.sin(rad) * (r * 0.6);
        const bRad1 = rad + 0.5;
        const bRad2 = rad - 0.5;
        ctx.beginPath();
        ctx.moveTo(bX, bY);
        ctx.lineTo(bX + Math.cos(bRad1) * (r * 0.35), bY + Math.sin(bRad1) * (r * 0.35));
        ctx.moveTo(bX, bY);
        ctx.lineTo(bX + Math.cos(bRad2) * (r * 0.35), bY + Math.sin(bRad2) * (r * 0.35));
        ctx.stroke();
      }
    };

    drawSnowflake(128, 128, 54);
    drawSnowflake(46, 50, 26);
    drawSnowflake(210, 200, 30);
  } else if (decalId === 'hazard') {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#2c3e50';
    for (let x = -100; x < 350; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 24, 0);
      ctx.lineTo(x - 24, 256);
      ctx.lineTo(x - 48, 256);
      ctx.closePath();
      ctx.fill();
    }
  } else if (decalId === 'peaks') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(10, 220);
    ctx.lineTo(80, 70);
    ctx.lineTo(130, 140);
    ctx.lineTo(180, 50);
    ctx.lineTo(246, 220);
    ctx.closePath();
    ctx.fill();

    // Mountain shadow side
    ctx.fillStyle = '#74b9ff';
    ctx.beginPath();
    ctx.moveTo(80, 70);
    ctx.lineTo(130, 140);
    ctx.lineTo(80, 220);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(180, 50);
    ctx.lineTo(246, 220);
    ctx.lineTo(180, 220);
    ctx.closePath();
    ctx.fill();
  } else if (decalId === 'flame-blizzard') {
    ctx.fillStyle = '#00d2d3';
    ctx.beginPath();
    ctx.moveTo(20, 250);
    ctx.quadraticCurveTo(80, 120, 50, 40);
    ctx.quadraticCurveTo(120, 110, 128, 10);
    ctx.quadraticCurveTo(140, 110, 200, 40);
    ctx.quadraticCurveTo(170, 130, 236, 250);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(60, 250);
    ctx.quadraticCurveTo(110, 160, 128, 80);
    ctx.quadraticCurveTo(146, 160, 196, 250);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHazardBladeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#2c3e50';
  for (let i = -32; i < 160; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 14, 0);
    ctx.lineTo(i - 2, 32);
    ctx.lineTo(i - 16, 32);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

/**
 * Creates the multi-part hero snow plow truck with full customizer support
 */
export function createPlowTruck(
  colorSchemeKey = 'nordic-red',
  bladeColorKey = 'gold',
  decalId = 'none',
  bladeLevel = 1
): VehicleMeshBundle {
  const group = new THREE.Group();
  const bodyHex = COLOR_SCHEMES[colorSchemeKey]?.hex || COLOR_SCHEMES['nordic-red'].hex;
  const bladeHex = BLADE_COLORS[bladeColorKey]?.hex || BLADE_COLORS['gold'].hex;

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyHex,
    roughness: 0.28,
    metalness: 0.45,
  });

  const darkChassisMaterial = new THREE.MeshStandardMaterial({
    color: 0x222629,
    roughness: 0.75,
    metalness: 0.6,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b1c1e,
    roughness: 0.9,
    metalness: 0.1,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xdcdde1,
    roughness: 0.2,
    metalness: 0.85,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x81ecec,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.65,
  });

  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: bladeHex,
    roughness: 0.35,
    metalness: 0.65,
  });

  // 1. Lower chassis frame
  const chassisGeom = new THREE.BoxGeometry(1.5, 0.45, 2.8);
  const chassis = new THREE.Mesh(chassisGeom, darkChassisMaterial);
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Cabin (main body)
  const cabGeom = new THREE.BoxGeometry(1.4, 0.9, 1.3);
  const cab = new THREE.Mesh(cabGeom, bodyMaterial);
  cab.position.set(0, 1.05, 0.15);
  cab.castShadow = true;
  cab.receiveShadow = true;
  group.add(cab);

  // 3. Cabin Roof
  const roofGeom = new THREE.BoxGeometry(1.46, 0.16, 1.38);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.4,
    metalness: 0.2,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, 1.55, 0.15);
  roof.castShadow = true;
  group.add(roof);

  // Decal Plane over Roof & Hood
  const decalPlaneGeom = new THREE.PlaneGeometry(1.2, 1.1);
  decalPlaneGeom.rotateX(-Math.PI / 2);
  const decalMat = new THREE.MeshBasicMaterial({
    map: createDecalTexture(decalId, bodyHex),
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const decalMesh = new THREE.Mesh(decalPlaneGeom, decalMat);
  decalMesh.position.set(0, 1.64, 0.15);
  group.add(decalMesh);

  // 4. Windows
  const windshieldGeom = new THREE.BoxGeometry(1.32, 0.55, 0.12);
  const windshield = new THREE.Mesh(windshieldGeom, glassMaterial);
  windshield.position.set(0, 1.15, 0.81);
  windshield.rotation.x = -0.12;
  group.add(windshield);

  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.08), glassMaterial);
  rearWindow.position.set(0, 1.15, -0.51);
  group.add(rearWindow);

  // 5. Rear Bed / Salt Hopper
  const hopperGeom = new THREE.BoxGeometry(1.36, 0.65, 1.1);
  const hopper = new THREE.Mesh(hopperGeom, darkChassisMaterial);
  hopper.position.set(0, 0.85, -0.95);
  hopper.castShadow = true;
  group.add(hopper);

  const saltGeom = new THREE.ConeGeometry(0.55, 0.4, 8);
  const salt = new THREE.Mesh(saltGeom, new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.95 }));
  salt.position.set(0, 1.25, -0.95);
  group.add(salt);

  // 6. Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.34, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  const hubGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 12);
  hubGeom.rotateZ(Math.PI / 2);

  const wheels: THREE.Mesh[] = [];
  const wheelPositions = [
    [-0.82, 0.38, 0.9],
    [0.82, 0.38, 0.9],
    [-0.82, 0.38, -0.85],
    [0.82, 0.38, -0.85],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeom, tireMaterial);
    tire.castShadow = true;
    const hub = new THREE.Mesh(hubGeom, rimMaterial);
    wheelGroup.add(tire);
    wheelGroup.add(hub);
    wheelGroup.position.set(x, y, z);
    group.add(wheelGroup);
    wheels.push(tire);
  });

  // 7. Dynamic Plow Blade Assembly
  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 0.35, 1.6);

  const bladeWidth = 1.9 + bladeLevel * 0.55;
  const bladeCurveGeom = new THREE.CylinderGeometry(0.55, 0.55, bladeWidth, 16, 1, false, 0, Math.PI * 0.6);
  bladeCurveGeom.rotateZ(Math.PI / 2);
  bladeCurveGeom.rotateX(Math.PI * 0.7);

  const blade = new THREE.Mesh(bladeCurveGeom, bladeMaterial);
  blade.castShadow = true;
  bladeGroup.add(blade);

  // Hazard stripe trim bar
  const stripeBarGeom = new THREE.BoxGeometry(bladeWidth * 0.96, 0.12, 0.1);
  const stripeMat = new THREE.MeshBasicMaterial({ map: createHazardBladeTexture() });
  const stripeBar = new THREE.Mesh(stripeBarGeom, stripeMat);
  stripeBar.position.set(0, 0.28, 0.08);
  bladeGroup.add(stripeBar);

  // Hydraulic arms
  const armGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
  armGeom.rotateX(Math.PI / 2.6);
  [-0.45, 0.45].forEach((hx) => {
    const arm = new THREE.Mesh(armGeom, darkChassisMaterial);
    arm.position.set(hx, 0.1, -0.35);
    bladeGroup.add(arm);
  });

  group.add(bladeGroup);

  // 8. Chrome side exhaust pipe
  const exhaustGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10);
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });
  const exhaust = new THREE.Mesh(exhaustGeom, chromeMat);
  exhaust.position.set(0.76, 1.35, -0.2);
  group.add(exhaust);

  const exhaustTip = new THREE.Vector3(0.76, 1.8, -0.2);

  // 9. Headlights
  const headlampGeom = new THREE.SphereGeometry(0.12, 12, 12);
  const lampEmissionMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });

  const lampL = new THREE.Mesh(headlampGeom, lampEmissionMat);
  lampL.position.set(-0.55, 0.72, 1.42);
  group.add(lampL);

  const lampR = new THREE.Mesh(headlampGeom, lampEmissionMat);
  lampR.position.set(0.55, 0.72, 1.42);
  group.add(lampR);

  const headlightL = new THREE.PointLight(0xfff3b0, 0.7, 9);
  headlightL.position.set(-0.55, 0.75, 1.6);
  group.add(headlightL);

  const headlightR = new THREE.PointLight(0xfff3b0, 0.7, 9);
  headlightR.position.set(0.55, 0.75, 1.6);
  group.add(headlightR);

  // Flashing amber beacon
  const beaconGeom = new THREE.CylinderGeometry(0.1, 0.12, 0.14, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffa502 });
  const beacon = new THREE.Mesh(beaconGeom, beaconMat);
  beacon.position.set(0, 1.68, 0.15);
  group.add(beacon);

  const updateCustomization = (bodyKey: string, bladeKey: string, decId: string) => {
    const newBodyHex = COLOR_SCHEMES[bodyKey]?.hex ?? bodyHex;
    const newBladeHex = BLADE_COLORS[bladeKey]?.hex ?? bladeHex;
    bodyMaterial.color.setHex(newBodyHex);
    bladeMaterial.color.setHex(newBladeHex);

    if (decalMesh) {
      if (decalMat.map) decalMat.map.dispose();
      decalMat.map = createDecalTexture(decId, newBodyHex);
      decalMat.needsUpdate = true;
    }
  };

  return {
    group,
    wheels,
    exhaustTip,
    bladeMesh: bladeGroup,
    headlightL,
    headlightR,
    bladeMaterial,
    bodyMaterial,
    stripeMesh: stripeBar,
    decalMesh,
    updateCustomization,
  };
}

/**
 * Creates cozy Alpine Cabin
 */
export function createCozyCabin(roofColor = 0xb33939): THREE.Group {
  const cabin = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.85, metalness: 0.1 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.4), wallMat);
  walls.position.y = 1.4;
  walls.castShadow = true;
  walls.receiveShadow = true;
  cabin.add(walls);

  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6 });
  const roofGeom = new THREE.ConeGeometry(3.6, 2.0, 4);
  roofGeom.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 3.6;
  roof.scale.set(1.2, 1, 0.9);
  roof.castShadow = true;
  cabin.add(roof);

  const snowMat = new THREE.MeshStandardMaterial({ color: 0xfafbfc, roughness: 0.9, metalness: 0.05 });
  const snowCap = new THREE.Mesh(roofGeom, snowMat);
  snowCap.position.y = 3.72;
  snowCap.scale.set(1.26, 0.95, 0.96);
  snowCap.castShadow = true;
  cabin.add(snowCap);

  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.9 });
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), chimneyMat);
  chimney.position.set(1.4, 3.4, -0.6);
  chimney.castShadow = true;
  cabin.add(chimney);

  const winMat = new THREE.MeshStandardMaterial({
    color: 0xffeaa7,
    emissive: 0xffc048,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });
  const winFront1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), winMat);
  winFront1.position.set(-1.1, 1.4, 1.72);
  cabin.add(winFront1);

  const winFront2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), winMat);
  winFront2.position.set(1.1, 1.4, 1.72);
  cabin.add(winFront2);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.7 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.1), doorMat);
  door.position.set(0, 0.8, 1.72);
  cabin.add(door);

  const porchLight = new THREE.PointLight(0xffb142, 0.8, 8);
  porchLight.position.set(0, 1.9, 2.1);
  cabin.add(porchLight);

  return cabin;
}

/**
 * Creates layered pine tree
 */
export function createPineTree(scale = 1.0): THREE.Group {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b382a, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.8, 8), trunkMat);
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  tree.add(trunk);

  const pineMat = new THREE.MeshStandardMaterial({ color: 0x225e3b, roughness: 0.7 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.95 });

  const tiers = [
    { radius: 1.8, height: 1.6, y: 2.0 },
    { radius: 1.4, height: 1.4, y: 2.9 },
    { radius: 0.95, height: 1.2, y: 3.8 },
  ];

  tiers.forEach((t) => {
    const pineGeom = new THREE.ConeGeometry(t.radius, t.height, 8);
    const pineMesh = new THREE.Mesh(pineGeom, pineMat);
    pineMesh.position.y = t.y;
    pineMesh.castShadow = true;
    tree.add(pineMesh);

    const snowGeom = new THREE.ConeGeometry(t.radius * 0.92, t.height * 0.45, 8);
    const snowMesh = new THREE.Mesh(snowGeom, snowMat);
    snowMesh.position.y = t.y + 0.35;
    snowMesh.castShadow = true;
    tree.add(snowMesh);
  });

  tree.scale.set(scale, scale, scale);
  return tree;
}

/**
 * Creates street lamp
 */
export function createStreetLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.7, metalness: 0.8 });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.2, 8), ironMat);
  post.position.y = 1.6;
  post.castShadow = true;
  lamp.add(post);

  const lanternGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.5, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0xffbe76,
      emissive: 0xffa801,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    })
  );
  lanternGlass.position.y = 3.35;
  lamp.add(lanternGlass);

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.25, 6),
    new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.9 })
  );
  cap.position.y = 3.7;
  lamp.add(cap);

  const light = new THREE.PointLight(0xffbe76, 1.2, 10);
  light.position.y = 3.3;
  lamp.add(light);

  return lamp;
}

/**
 * Creates snowman
 */
export function createSnowman(): THREE.Group {
  const snowman = new THREE.Group();
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.95 });

  const base = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 14), snowMat);
  base.position.y = 0.75;
  base.castShadow = true;
  snowman.add(base);

  const middle = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 14), snowMat);
  middle.position.y = 1.8;
  middle.castShadow = true;
  snowman.add(middle);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 14), snowMat);
  head.position.y = 2.6;
  head.castShadow = true;
  snowman.add(head);

  const noseMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.5 });
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), noseMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 2.6, 0.52);
  snowman.add(nose);

  const coalMat = new THREE.MeshBasicMaterial({ color: 0x1e272e });
  const eyeGeom = new THREE.SphereGeometry(0.045, 6, 6);
  [-0.12, 0.12].forEach((ex) => {
    const eye = new THREE.Mesh(eyeGeom, coalMat);
    eye.position.set(ex, 2.7, 0.36);
    snowman.add(eye);
  });

  const hatMat = new THREE.MeshStandardMaterial({ color: 0x2f3542, roughness: 0.8 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 12), hatMat);
  brim.position.y = 2.96;
  snowman.add(brim);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 12), hatMat);
  crown.position.y = 3.2;
  crown.castShadow = true;
  snowman.add(crown);

  const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xd63031 });
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.08, 12), ribbonMat);
  ribbon.position.y = 3.06;
  snowman.add(ribbon);

  return snowman;
}

/**
 * Creates collectible item
 */
export function createCollectibleItem(type: 'star' | 'cocoa'): THREE.Group {
  const item = new THREE.Group();

  if (type === 'star') {
    const starGeom = new THREE.OctahedronGeometry(0.45, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd32a,
      emissive: 0xffa801,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const star = new THREE.Mesh(starGeom, starMat);
    star.position.y = 0.55;
    star.castShadow = true;
    item.add(star);

    const aura = new THREE.PointLight(0xffd32a, 0.6, 4);
    aura.position.y = 0.55;
    item.add(aura);
  } else {
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xeb4d4b, roughness: 0.3 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.48, 12), mugMat);
    mug.position.y = 0.35;
    mug.castShadow = true;
    item.add(mug);

    const marshMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const marsh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), marshMat);
    marsh.position.set(0.06, 0.55, 0.04);
    item.add(marsh);

    const glow = new THREE.PointLight(0xff7675, 0.5, 3);
    glow.position.y = 0.45;
    item.add(glow);
  }

  return item;
}

/**
 * Split rail wooden fence
 */
export function createFenceSegment(): THREE.Group {
  const fence = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });

  const postGeom = new THREE.BoxGeometry(0.16, 1.1, 0.16);
  const p1 = new THREE.Mesh(postGeom, woodMat);
  p1.position.set(-1.0, 0.55, 0);
  p1.castShadow = true;
  fence.add(p1);

  const p2 = new THREE.Mesh(postGeom, woodMat);
  p2.position.set(1.0, 0.55, 0);
  p2.castShadow = true;
  fence.add(p2);

  const railGeom = new THREE.BoxGeometry(2.1, 0.1, 0.08);
  const r1 = new THREE.Mesh(railGeom, woodMat);
  r1.position.set(0, 0.42, 0);
  fence.add(r1);

  const r2 = new THREE.Mesh(railGeom, woodMat);
  r2.position.set(0, 0.82, 0);
  fence.add(r2);

  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.95 });
  const snowRail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.12), snowMat);
  snowRail.position.set(0, 0.88, 0);
  fence.add(snowRail);

  return fence;
}
