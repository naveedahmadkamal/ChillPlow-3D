import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface SceneBundle {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  ambientLight: THREE.HemisphereLight;
  dirLight: THREE.DirectionalLight;
  isSoftwareGl: boolean;
  updateSnowFall: (dt: number, centerPos: THREE.Vector3) => void;
  dispose: () => void;
}

export function createScene(container: HTMLDivElement): SceneBundle {
  // Software WebGL detection per Three.js skill guidelines
  const isSoftwareGl = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  })();

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const skyColor = 0xdbe9f6; // Soft cozy winter dusk/sky
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.FogExp2(skyColor, 0.018);

  // Generate procedural studio environment for metal & chrome reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  pmremGenerator.dispose();

  // True Isometric Orthographic Camera
  const aspect = width / height;
  const frustumSize = 24;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    300
  );

  // Classic isometric camera angle: 45° azimuth, 35.264° elevation
  const isoDistance = 45;
  camera.position.set(isoDistance, isoDistance * 1.05, isoDistance);
  camera.lookAt(0, 0, 0);

  // Warm / Cool Lighting Rig
  const ambientLight = new THREE.HemisphereLight(0xdbe9f6, 0xa4b0be, 0.85);
  scene.add(ambientLight);

  // Warm afternoon sunlight
  const dirLight = new THREE.DirectionalLight(0xfff5e4, 1.4);
  dirLight.position.set(30, 45, 20);
  dirLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 36;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.03;
  }
  scene.add(dirLight);

  // Soft cool rim light
  const rimLight = new THREE.DirectionalLight(0xa4c8e1, 0.5);
  rimLight.position.set(-25, 20, -25);
  scene.add(rimLight);

  // Gentle falling ambient snowflakes
  const snowFlakeCount = isSoftwareGl ? 350 : 800;
  const snowGeo = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(snowFlakeCount * 3);
  const snowVelocities: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i < snowFlakeCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 60;
    snowPositions[i * 3 + 1] = Math.random() * 25;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    snowVelocities.push({
      x: (Math.random() - 0.5) * 0.8,
      y: -(1.5 + Math.random() * 2.0),
      z: (Math.random() - 0.5) * 0.8,
    });
  }

  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.35,
    transparent: true,
    opacity: 0.85,
  });

  const snowParticles = new THREE.Points(snowGeo, snowMat);
  scene.add(snowParticles);

  const updateSnowFall = (dt: number, centerPos: THREE.Vector3) => {
    const posAttr = snowGeo.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < snowFlakeCount; i++) {
      const idx = i * 3;
      posArray[idx] += snowVelocities[i].x * dt;
      posArray[idx + 1] += snowVelocities[i].y * dt;
      posArray[idx + 2] += snowVelocities[i].z * dt;

      // Wrap around vehicle center
      if (posArray[idx + 1] < 0) {
        posArray[idx + 1] = 24 + Math.random() * 4;
        posArray[idx] = centerPos.x + (Math.random() - 0.5) * 55;
        posArray[idx + 2] = centerPos.z + (Math.random() - 0.5) * 55;
      }
    }
    posAttr.needsUpdate = true;
  };

  const handleResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const asp = w / h;
    camera.left = (-frustumSize * asp) / 2;
    camera.right = (frustumSize * asp) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  window.addEventListener('resize', handleResize);

  const dispose = () => {
    window.removeEventListener('resize', handleResize);
    snowGeo.dispose();
    snowMat.dispose();
    scene.remove(snowParticles);
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return {
    renderer,
    scene,
    camera,
    ambientLight,
    dirLight,
    isSoftwareGl,
    updateSnowFall,
    dispose,
  };
}
