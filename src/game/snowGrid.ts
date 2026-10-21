import * as THREE from 'three';

export interface SnowCell {
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  density: number; // 1.0 full snow, 0.0 cleared
  initialDensity: number;
  instanceIndex: number;
  cleared: boolean;
}

export interface SnowSprayParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  scale: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class SnowManager {
  public cells: SnowCell[] = [];
  public totalSnowCells = 0;
  public clearedSnowCells = 0;
  public instancedMesh: THREE.InstancedMesh | null = null;
  public driftMesh: THREE.InstancedMesh | null = null;

  // Particle pool for snow spray
  private particles: SnowSprayParticle[] = [];
  private particleMesh: THREE.InstancedMesh | null = null;
  private maxParticles = 240;

  private scene: THREE.Scene;
  private cellSize = 0.9;
  private width = 0;
  private height = 0;
  private minX = 0;
  private minZ = 0;

  // Reusable helpers for zero GC
  private dummy = new THREE.Object3D();
  private particleDummy = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticlePool();
  }

  private initParticlePool() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        scale: 0.2,
        life: 0,
        maxLife: 1.0,
        active: false,
      });
    }

    const geom = new THREE.DodecahedronGeometry(0.18, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
    });

    this.particleMesh = new THREE.InstancedMesh(geom, mat, this.maxParticles);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.castShadow = true;
    this.particleMesh.receiveShadow = false;

    // Initially hide all particles underground
    for (let i = 0; i < this.maxParticles; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.particleMesh);
  }

  /**
   * Initializes snow grid over roads, driveways, and plazas
   */
  public generateGrid(gridWidth: number, gridHeight: number, roadPaths: { x: number; z: number; width: number; length: number; isRotated?: boolean }[]) {
    // Clear previous
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.instancedMesh = null;
    }

    this.cells = [];
    this.clearedSnowCells = 0;
    this.width = gridWidth;
    this.height = gridHeight;
    this.minX = -gridWidth / 2;
    this.minZ = -gridHeight / 2;

    const cols = Math.floor(gridWidth / this.cellSize);
    const rows = Math.floor(gridHeight / this.cellSize);

    // Identify which cells fall on plowable road corridors & driveways
    const activeCoords: { gx: number; gz: number; wx: number; wz: number }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = this.minX + c * this.cellSize + this.cellSize * 0.5;
        const wz = this.minZ + r * this.cellSize + this.cellSize * 0.5;

        // Check if inside any road corridor
        const isOnRoad = roadPaths.some((road) => {
          if (road.isRotated) {
            // vertical strip
            return Math.abs(wx - road.x) <= road.width / 2 && Math.abs(wz - road.z) <= road.length / 2;
          } else {
            // horizontal strip
            return Math.abs(wx - road.x) <= road.length / 2 && Math.abs(wz - road.z) <= road.width / 2;
          }
        });

        if (isOnRoad) {
          activeCoords.push({ gx: c, gz: r, wx, wz });
        }
      }
    }

    this.totalSnowCells = activeCoords.length;

    // Create instanced mesh for snow tiles
    // Beveled rounded box for fluffy snow appearance
    const tileGeom = new THREE.BoxGeometry(this.cellSize * 0.96, 0.22, this.cellSize * 0.96);
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0xfafbfc,
      roughness: 0.92,
      metalness: 0.05,
    });

    this.instancedMesh = new THREE.InstancedMesh(tileGeom, tileMat, this.totalSnowCells);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < activeCoords.length; i++) {
      const coord = activeCoords[i];
      const cell: SnowCell = {
        gridX: coord.gx,
        gridZ: coord.gz,
        worldX: coord.wx,
        worldZ: coord.wz,
        density: 1.0,
        initialDensity: 1.0,
        instanceIndex: i,
        cleared: false,
      };
      this.cells.push(cell);

      this.dummy.position.set(coord.wx, 0.11, coord.wz);
      this.dummy.rotation.set(0, (Math.random() - 0.5) * 0.08, 0);
      this.dummy.scale.set(1.0, 1.0, 1.0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.computeBoundingSphere();
    this.scene.add(this.instancedMesh);
  }

  /**
   * Plowing action: Clears snow cells within blade sweep
   * Returns the count of newly cleared cells
   */
  public plowSweep(
    bladeX: number,
    bladeZ: number,
    heading: number,
    bladeWidth: number,
    sweepDepth: number,
    saltBonus = false
  ): number {
    if (!this.instancedMesh || this.cells.length === 0) return 0;

    let newlyCleared = 0;
    const effectiveRadius = bladeWidth * 0.55 + (saltBonus ? 0.4 : 0);
    const radiusSq = effectiveRadius * effectiveRadius;

    // Vector pointing forward from vehicle
    const forwardX = Math.sin(heading);
    const forwardZ = Math.cos(heading);

    // Vector pointing to the sides
    const sideX = Math.cos(heading);
    const sideZ = -Math.sin(heading);

    let needsMeshUpdate = false;

    // Check cells near blade
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      if (cell.cleared) continue;

      const dx = cell.worldX - bladeX;
      const dz = cell.worldZ - bladeZ;
      const distSq = dx * dx + dz * dz;

      if (distSq > radiusSq * 1.5) continue;

      // Project onto forward and side axes
      const dotForward = dx * forwardX + dz * forwardZ;
      const dotSide = dx * sideX + dz * sideZ;

      if (Math.abs(dotSide) <= effectiveRadius && dotForward >= -0.5 && dotForward <= sweepDepth + 0.6) {
        // Clear this snow cell!
        cell.density = 0;
        cell.cleared = true;
        newlyCleared++;

        // Instantly shrink snow tile out of view
        this.dummy.position.set(cell.worldX, -0.4, cell.worldZ);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(cell.instanceIndex, this.dummy.matrix);
        needsMeshUpdate = true;

        // Emit snow spray towards the sides!
        const sprayDir = dotSide >= 0 ? 1 : -1;
        this.spawnSnowSpray(
          cell.worldX,
          0.3,
          cell.worldZ,
          sideX * sprayDir * (3.5 + Math.random() * 2.5),
          2.0 + Math.random() * 2.5,
          sideZ * sprayDir * (3.5 + Math.random() * 2.5)
        );
      }
    }

    if (needsMeshUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      this.clearedSnowCells += newlyCleared;
    }

    return newlyCleared;
  }

  /**
   * Spawns snow spray particle burst
   */
  public spawnSnowSpray(x: number, y: number, z: number, vx: number, vy: number, vz: number) {
    // Find an inactive particle in pool
    const p = this.particles.find((item) => !item.active);
    if (!p) return;

    p.active = true;
    p.pos.set(x, y, z);
    p.vel.set(vx + (Math.random() - 0.5) * 1.2, vy, vz + (Math.random() - 0.5) * 1.2);
    p.life = 0;
    p.maxLife = 0.45 + Math.random() * 0.35;
    p.scale = 0.28 + Math.random() * 0.2;
  }

  /**
   * Updates snow spray physics (gravity & dissipation)
   */
  public updateParticles(dt: number) {
    if (!this.particleMesh) return;
    let anyActive = false;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      anyActive = true;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.particleMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      // Physics
      p.vel.y -= 9.8 * dt; // gravity
      p.pos.x += p.vel.x * dt;
      p.pos.y = Math.max(0.05, p.pos.y + p.vel.y * dt);
      p.pos.z += p.vel.z * dt;

      const progress = p.life / p.maxLife;
      const currentScale = p.scale * (1.0 - progress * 0.65);

      this.particleDummy.position.copy(p.pos);
      this.particleDummy.scale.set(currentScale, currentScale, currentScale);
      this.particleDummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.particleDummy.matrix);
    }

    if (anyActive) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Dynamic weather snowfall mechanic: Re-accumulates fresh snow on cleared cells
   */
  public reaccumulateSnow(count: number, playerX: number, playerZ: number): number {
    if (!this.instancedMesh || count <= 0) return 0;

    const clearedCells = this.cells.filter(
      (c) => c.cleared && Math.hypot(c.worldX - playerX, c.worldZ - playerZ) > 4.5
    );

    if (clearedCells.length === 0) return 0;

    const toRestore = Math.min(count, clearedCells.length);
    let restored = 0;

    for (let k = 0; k < toRestore; k++) {
      const randIdx = Math.floor(Math.random() * clearedCells.length);
      const cell = clearedCells.splice(randIdx, 1)[0];

      cell.cleared = false;
      cell.density = 1.0;
      restored++;

      // Restore snow tile instance matrix
      this.dummy.position.set(cell.worldX, 0.11, cell.worldZ);
      this.dummy.rotation.set(0, (Math.random() - 0.5) * 0.08, 0);
      this.dummy.scale.set(1.0, 1.0, 1.0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(cell.instanceIndex, this.dummy.matrix);
    }

    if (restored > 0) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      this.clearedSnowCells = Math.max(0, this.clearedSnowCells - restored);
    }

    return restored;
  }

  public getClearedPercentage(): number {
    if (this.totalSnowCells === 0) return 0;
    return Math.min(100, (this.clearedSnowCells / this.totalSnowCells) * 100);
  }

  public dispose() {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
    }
    if (this.particleMesh) {
      this.scene.remove(this.particleMesh);
      this.particleMesh.geometry.dispose();
      (this.particleMesh.material as THREE.Material).dispose();
    }
    this.cells = [];
  }
}
