import * as THREE from 'three';
import {
  ComboState,
  GameStats,
  GameState,
  LevelConfig,
  TownEvent,
  TownReputation,
  UpgradeConfig,
  VehicleState,
  VehicleUpgrades,
} from '../types/game';
import { synthAudio } from '../audio/synthAudio';
import {
  COLOR_SCHEMES,
  createCozyCabin,
  createFenceSegment,
  createPineTree,
  createPlowTruck,
  createSnowman,
  createStreetLamp,
  createCollectibleItem,
  VehicleMeshBundle,
} from './models';
import { SnowManager } from './snowGrid';
import { WeatherSystem } from './weather';
import { LEVELS, LevelEnvironment, LevelObstacle } from './levels';

export const UPGRADES_CONFIG: UpgradeConfig[] = [
  {
    id: 'bladeLevel',
    name: 'Plow Blade Width',
    desc: 'Wider reinforced plow blade sweeps wider road corridors in a single pass.',
    baseCost: 80,
    costMultiplier: 1.8,
    maxLevel: 4,
    statName: 'Width',
    getStatDisplay: (lvl) => `${(1.9 + lvl * 0.55).toFixed(1)}m`,
  },
  {
    id: 'engineLevel',
    name: 'Turbo Engine',
    desc: 'Increases plow top speed, push torque through deep snow, and hill climbing.',
    baseCost: 100,
    costMultiplier: 1.7,
    maxLevel: 4,
    statName: 'Top Speed',
    getStatDisplay: (lvl) => `${(11 + lvl * 2.8).toFixed(0)} km/h`,
  },
  {
    id: 'blowerLevel',
    name: 'Snow Jet Blower',
    desc: 'Pneumatic side-blowers shoot plowed snow banks far off into road verges.',
    baseCost: 120,
    costMultiplier: 1.9,
    maxLevel: 4,
    statName: 'Throw Arc',
    getStatDisplay: (lvl) => `${lvl * 2.5}m Arc`,
  },
  {
    id: 'saltLevel',
    name: 'Rear Salt Spreader',
    desc: 'Scatters rock salt behind the plow to melt residual ice patches and prevent re-freeze.',
    baseCost: 90,
    costMultiplier: 1.75,
    maxLevel: 4,
    statName: 'Melt Bonus',
    getStatDisplay: (lvl) => `+${lvl * 15}% Area`,
  },
  {
    id: 'gripLevel',
    name: 'Studded Snow Chains',
    desc: 'Enhances tire traction on icy corners, reduces unintended slides, and sharpens steering.',
    baseCost: 75,
    costMultiplier: 1.6,
    maxLevel: 4,
    statName: 'Ice Grip',
    getStatDisplay: (lvl) => `${60 + lvl * 12}%`,
  },
];

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public snowManager: SnowManager;
  public weatherSystem: WeatherSystem;

  public currentLevelIndex = 0;
  public currentLevel: LevelEnvironment = LEVELS[0];
  public gameState: GameState = 'title';

  // Vehicle
  public vehicleMeshBundle: VehicleMeshBundle | null = null;
  public vehicleState: VehicleState = {
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    heading: 0,
    steerAngle: 0,
    speed: 0,
    isBoosting: false,
    boostFuel: 100,
    isDrifting: false,
    bladeWidth: 2.45,
  };

  public upgrades: VehicleUpgrades = {
    bladeLevel: 1,
    engineLevel: 1,
    blowerLevel: 1,
    saltLevel: 1,
    gripLevel: 1,
    colorScheme: 'nordic-red',
    bladeColor: 'gold',
    decalId: 'none',
  };

  public reputation: TownReputation = {
    score: 50, // start at 50% "Neighborhood Helper"
    rankTitle: 'Neighborhood Helper',
    incidents: [],
    roadsCleanedCount: 0,
    propertyDamageCount: 0,
    rescuedCabins: 0,
  };

  public stats: GameStats = {
    score: 0,
    coins: 150,
    clearedSnowCount: 0,
    totalSnowCount: 0,
    clearedPercent: 0,
    elapsedTime: 0,
    combo: {
      multiplier: 1.0,
      streak: 0,
      timer: 0,
      maxCombo: 1.0,
      lastPointsAdded: 0,
      label: '',
    },
    starsCollected: 0,
    reputation: {
      score: 50,
      rankTitle: 'Neighborhood Helper',
      incidents: [],
      roadsCleanedCount: 0,
      propertyDamageCount: 0,
      rescuedCabins: 0,
    },
    weather: {
      intensity: 'flurries',
      intensityFactor: 0.4,
      name: 'Cozy Flurries',
      icon: '❄️',
      desc: 'Light powder falling steadily',
      windAngle: 0,
      windSpeed: 0.5,
      accumulationRate: 0.35,
      timeRemainingInWeather: 40,
      blizzardWarning: false,
    },
    activeEvent: null,
  };

  public inputs: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
  };

  // Environment obstacles in current level
  private obstacleMeshes: { mesh: THREE.Group; type: string; x: number; z: number; radius: number; active: boolean }[] = [];
  private roadMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;

  // Camera Shake
  private cameraShake = 0;

  // Collision cooldown to prevent spam
  private lastCollisionTime = 0;

  // Event timer
  private nextEventCountdown = 25;

  // Reusable vector math objects
  private _camTarget = new THREE.Vector3();
  private _vehiclePos = new THREE.Vector3();

  // Callbacks
  public onStatsUpdate?: (stats: GameStats) => void;
  public onStateChange?: (state: GameState) => void;

  constructor(scene: THREE.Scene, camera: THREE.OrthographicCamera) {
    this.scene = scene;
    this.camera = camera;
    this.snowManager = new SnowManager(scene);
    this.weatherSystem = new WeatherSystem();
  }

  public init() {
    this.loadLevel(0);
    this.updateReputationTitle();
  }

  public setGameState(state: GameState) {
    this.gameState = state;
    if (this.onStateChange) this.onStateChange(state);

    if (state === 'playing') {
      synthAudio.unlock();
    }
  }

  public loadLevel(levelIndex: number) {
    this.currentLevelIndex = levelIndex;
    this.currentLevel = LEVELS[levelIndex] || LEVELS[0];

    // Clean up existing meshes
    if (this.vehicleMeshBundle) {
      this.scene.remove(this.vehicleMeshBundle.group);
      this.vehicleMeshBundle = null;
    }

    if (this.roadMesh) {
      this.scene.remove(this.roadMesh);
      this.roadMesh.geometry.dispose();
      (this.roadMesh.material as THREE.Material).dispose();
      this.roadMesh = null;
    }

    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      this.groundMesh.geometry.dispose();
      (this.groundMesh.material as THREE.Material).dispose();
      this.groundMesh = null;
    }

    this.obstacleMeshes.forEach((obs) => {
      this.scene.remove(obs.mesh);
    });
    this.obstacleMeshes = [];

    // 1. Build Ground Terrain
    this.buildTerrain();

    // 2. Build Road & Driveway Surfaces
    this.buildRoads();

    // 3. Build Obstacles (Cabins, Lamps, Snowmen, Trees, Pickups)
    this.buildObstacles();

    // 4. Generate Snow Grid
    this.snowManager.generateGrid(
      this.currentLevel.config.gridSize.width,
      this.currentLevel.config.gridSize.height,
      this.currentLevel.roadPaths
    );

    // 5. Spawn Plow Truck
    this.spawnPlayerVehicle();

    // Reset stats for level
    this.stats.clearedSnowCount = 0;
    this.stats.totalSnowCount = this.snowManager.totalSnowCells;
    this.stats.clearedPercent = 0;
    this.stats.elapsedTime = 0;
    this.stats.combo = {
      multiplier: 1.0,
      streak: 0,
      timer: 0,
      maxCombo: 1.0,
      lastPointsAdded: 0,
      label: '',
    };
    this.stats.starsCollected = 0;
    this.stats.reputation = this.reputation;
    this.stats.weather = this.weatherSystem.state;
    this.stats.activeEvent = null;

    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
  }

  private buildTerrain() {
    const size = Math.max(this.currentLevel.config.gridSize.width, this.currentLevel.config.gridSize.height) + 40;
    const geom = new THREE.PlaneGeometry(size, size, 1, 1);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      roughness: 0.95,
      metalness: 0.05,
    });

    this.groundMesh = new THREE.Mesh(geom, mat);
    this.groundMesh.position.y = -0.05;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  private buildRoads() {
    const roadGroup = new THREE.Group();
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x3d434d, // Clean dark asphalt / cobblestone beneath snow
      roughness: 0.8,
      metalness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.currentLevel.roadPaths.forEach((road) => {
      const w = road.isRotated ? road.width : road.length;
      const l = road.isRotated ? road.length : road.width;
      const roadGeom = new THREE.PlaneGeometry(w, l);
      roadGeom.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(roadGeom, roadMat);
      mesh.position.set(road.x, 0.01, road.z);
      mesh.receiveShadow = true;
      roadGroup.add(mesh);
    });

    this.scene.add(roadGroup);
  }

  private buildObstacles() {
    this.currentLevel.obstacles.forEach((obs) => {
      let mesh: THREE.Group | null = null;
      let radius = 1.0;

      switch (obs.type) {
        case 'cabin':
          mesh = createCozyCabin(obs.roofColor);
          radius = 2.4;
          break;
        case 'tree':
          mesh = createPineTree(obs.scale || 1.0);
          radius = 1.2;
          break;
        case 'lamp':
          mesh = createStreetLamp();
          radius = 0.6;
          break;
        case 'snowman':
          mesh = createSnowman();
          radius = 0.9;
          break;
        case 'fence':
          mesh = createFenceSegment();
          radius = 1.2;
          break;
        case 'pickup_star':
          mesh = createCollectibleItem('star');
          radius = 0.9;
          break;
        case 'pickup_cocoa':
          mesh = createCollectibleItem('cocoa');
          radius = 0.9;
          break;
      }

      if (mesh) {
        mesh.position.set(obs.x, 0, obs.z);
        if (obs.rotation) mesh.rotation.y = obs.rotation;
        this.scene.add(mesh);

        this.obstacleMeshes.push({
          mesh,
          type: obs.type,
          x: obs.x,
          z: obs.z,
          radius,
          active: true,
        });
      }
    });
  }

  private spawnPlayerVehicle() {
    const spawn = this.currentLevel.playerSpawn;
    this.vehicleMeshBundle = createPlowTruck(
      this.upgrades.colorScheme,
      this.upgrades.bladeColor,
      this.upgrades.decalId,
      this.upgrades.bladeLevel
    );

    this.vehicleState.x = spawn.x;
    this.vehicleState.z = spawn.z;
    this.vehicleState.heading = spawn.heading;
    this.vehicleState.vx = 0;
    this.vehicleState.vz = 0;
    this.vehicleState.speed = 0;
    this.vehicleState.steerAngle = 0;
    this.vehicleState.bladeWidth = 1.9 + this.upgrades.bladeLevel * 0.55;

    this.vehicleMeshBundle.group.position.set(spawn.x, 0, spawn.z);
    this.vehicleMeshBundle.group.rotation.y = spawn.heading;
    this.scene.add(this.vehicleMeshBundle.group);
  }

  public applyCustomization(colorKey: string, bladeColorKey: string, decalId: string) {
    this.upgrades.colorScheme = colorKey;
    this.upgrades.bladeColor = bladeColorKey;
    this.upgrades.decalId = decalId;

    if (this.vehicleMeshBundle) {
      this.vehicleMeshBundle.updateCustomization(colorKey, bladeColorKey, decalId);
    }
  }

  public purchaseUpgrade(upgradeId: keyof Omit<VehicleUpgrades, 'colorScheme' | 'bladeColor' | 'decalId'>): boolean {
    const conf = UPGRADES_CONFIG.find((u) => u.id === upgradeId);
    if (!conf) return false;

    const currentLvl = this.upgrades[upgradeId];
    if (currentLvl >= conf.maxLevel) return false;

    const cost = Math.floor(conf.baseCost * Math.pow(conf.costMultiplier, currentLvl - 1));
    if (this.stats.coins < cost) return false;

    this.stats.coins -= cost;
    this.upgrades[upgradeId] = currentLvl + 1;

    // Recalculate blade width if upgraded
    if (upgradeId === 'bladeLevel') {
      this.vehicleState.bladeWidth = 1.9 + this.upgrades.bladeLevel * 0.55;
      // Re-create vehicle mesh to reflect wider blade
      if (this.vehicleMeshBundle) {
        this.scene.remove(this.vehicleMeshBundle.group);
        this.vehicleMeshBundle = createPlowTruck(
          this.upgrades.colorScheme,
          this.upgrades.bladeColor,
          this.upgrades.decalId,
          this.upgrades.bladeLevel
        );
        this.vehicleMeshBundle.group.position.set(this.vehicleState.x, 0, this.vehicleState.z);
        this.vehicleMeshBundle.group.rotation.y = this.vehicleState.heading;
        this.scene.add(this.vehicleMeshBundle.group);
      }
    }

    synthAudio.playUpgradeFanfare();
    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
    return true;
  }

  public getUpgradeCost(upgradeId: keyof Omit<VehicleUpgrades, 'colorScheme' | 'bladeColor' | 'decalId'>): number {
    const conf = UPGRADES_CONFIG.find((u) => u.id === upgradeId);
    if (!conf) return 0;
    const lvl = this.upgrades[upgradeId];
    return Math.floor(conf.baseCost * Math.pow(conf.costMultiplier, lvl - 1));
  }

  private updateReputationTitle() {
    const s = this.reputation.score;
    let rank = 'Rookie Shoveler';
    if (s >= 90) rank = 'Legend of the Snowdrifts';
    else if (s >= 75) rank = 'Town Hero';
    else if (s >= 50) rank = 'Chief Winter Warden';
    else if (s >= 25) rank = 'Neighborhood Helper';

    this.reputation.rankTitle = rank;

    // Check if new levels are unlocked
    LEVELS.forEach((lvl) => {
      if (this.reputation.score >= lvl.config.requiredReputation) {
        lvl.config.unlocked = true;
      }
    });
  }

  public addReputationIncident(text: string, delta: number) {
    this.reputation.score = Math.max(0, Math.min(100, this.reputation.score + delta));
    this.reputation.incidents.unshift({
      text,
      delta,
      timestamp: Date.now(),
    });
    if (this.reputation.incidents.length > 5) {
      this.reputation.incidents.pop();
    }
    this.updateReputationTitle();
  }

  /**
   * Main per-frame update loop
   */
  public update(rawDt: number) {
    const dt = Math.min(rawDt, 0.05);

    // Dynamic Weather Update
    const { reaccumulateCount, weatherChanged } = this.weatherSystem.update(dt);
    if (weatherChanged) {
      if (this.weatherSystem.state.intensity === 'blizzard') {
        synthAudio.playBoost(); // dramatic cue
      }
    }

    // Snow Re-accumulation during storms
    if (this.gameState === 'playing' && reaccumulateCount > 0) {
      this.snowManager.reaccumulateSnow(reaccumulateCount, this.vehicleState.x, this.vehicleState.z);
    }

    // Update snow spray particles
    this.snowManager.updateParticles(dt);

    if (this.gameState === 'playing') {
      this.updateVehiclePhysics(dt);
      this.checkObstacleCollisions();
      this.updateCombo(dt);
      this.updateTownEvents(dt);
      this.stats.elapsedTime += dt;
      this.checkLevelCompletion();
    } else if (this.gameState === 'title') {
      // Gentle camera orbit over town for title screen
      const time = performance.now() * 0.0003;
      const radius = 38;
      this.camera.position.x = Math.sin(time) * radius;
      this.camera.position.z = Math.cos(time) * radius;
      this.camera.position.y = 36;
      this.camera.lookAt(0, 0, 0);
    }

    // Camera following vehicle smoothly
    if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'level_complete') {
      this.updateCameraFollow(dt);
    }

    // Animate collectibles (spin & bob)
    this.obstacleMeshes.forEach((obs) => {
      if (obs.active && (obs.type === 'pickup_star' || obs.type === 'pickup_cocoa')) {
        obs.mesh.rotation.y += 2.0 * dt;
        obs.mesh.position.y = Math.sin(performance.now() * 0.003 + obs.x) * 0.15;
      }
    });

    // Sync stats
    this.stats.clearedSnowCount = this.snowManager.clearedSnowCells;
    this.stats.clearedPercent = this.snowManager.getClearedPercentage();
    this.stats.reputation = this.reputation;
    this.stats.weather = this.weatherSystem.state;

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.stats);
    }
  }

  private updateVehiclePhysics(dt: number) {
    if (!this.vehicleMeshBundle) return;
    const v = this.vehicleState;

    // Upgrades impact
    const maxSpeed = 8.5 + this.upgrades.engineLevel * 2.2;
    const accelRate = 12 + this.upgrades.engineLevel * 3.5;
    const brakeRate = 22;
    const gripFactor = 0.65 + this.upgrades.gripLevel * 0.09;
    const turnRate = 2.4;

    // Boost logic
    let targetMaxSpeed = maxSpeed;
    if (this.inputs.boost && v.boostFuel > 5) {
      v.isBoosting = true;
      v.boostFuel = Math.max(0, v.boostFuel - 28 * dt);
      targetMaxSpeed *= 1.45;
    } else {
      v.isBoosting = false;
      v.boostFuel = Math.min(100, v.boostFuel + 12 * dt);
    }

    // Throttle / Reverse
    if (this.inputs.forward) {
      v.speed = Math.min(targetMaxSpeed, v.speed + accelRate * dt);
    } else if (this.inputs.backward) {
      v.speed = Math.max(-maxSpeed * 0.5, v.speed - accelRate * 0.9 * dt);
    } else {
      // Natural friction & drag
      if (v.speed > 0) v.speed = Math.max(0, v.speed - brakeRate * 0.45 * dt);
      else if (v.speed < 0) v.speed = Math.min(0, v.speed + brakeRate * 0.45 * dt);
    }

    // Steering
    const isMoving = Math.abs(v.speed) > 0.1;
    const steerDir = (this.inputs.left ? 1 : 0) - (this.inputs.right ? 1 : 0);
    const speedFactor = Math.min(1.0, Math.abs(v.speed) / 5.0);

    if (steerDir !== 0 && isMoving) {
      const headingDelta = steerDir * turnRate * dt * (v.speed >= 0 ? 1 : -1) * (0.4 + speedFactor * 0.6);
      v.heading += headingDelta;
      v.steerAngle = THREE.MathUtils.damp(v.steerAngle, steerDir * 0.5, 8, dt);
    } else {
      v.steerAngle = THREE.MathUtils.damp(v.steerAngle, 0, 10, dt);
    }

    // Velocity & Traction integration
    const forwardX = Math.sin(v.heading);
    const forwardZ = Math.cos(v.heading);

    const targetVx = forwardX * v.speed;
    const targetVz = forwardZ * v.speed;

    // Drifting physics: lateral slip vs grip
    v.vx = THREE.MathUtils.damp(v.vx, targetVx, 12 * gripFactor, dt);
    v.vz = THREE.MathUtils.damp(v.vz, targetVz, 12 * gripFactor, dt);

    const lateralSlip = Math.hypot(v.vx - targetVx, v.vz - targetVz);
    v.isDrifting = lateralSlip > 2.2 && Math.abs(v.speed) > 4.0;

    // Integrate position
    v.x += v.vx * dt;
    v.z += v.vz * dt;

    // Boundaries clamp
    const bounds = this.currentLevel.config.gridSize.width / 2 + 1;
    v.x = Math.max(-bounds, Math.min(bounds, v.x));
    v.z = Math.max(-bounds, Math.min(bounds, v.z));

    // Update 3D mesh
    this.vehicleMeshBundle.group.position.set(v.x, 0, v.z);
    this.vehicleMeshBundle.group.rotation.y = v.heading;

    // Animate wheels
    this.vehicleMeshBundle.wheels.forEach((wheel, idx) => {
      wheel.rotation.x += (v.speed * dt * 2.5) / 0.38;
      // Front wheels turn with steerAngle
      if (idx < 2) {
        wheel.parent?.rotation.set(0, v.steerAngle, 0);
      }
    });

    // Plowing snow swept check
    const bladeOffset = 1.7;
    const bladeX = v.x + forwardX * bladeOffset;
    const bladeZ = v.z + forwardZ * bladeOffset;

    let clearedInSweep = 0;
    if (v.speed > 0.5) {
      clearedInSweep = this.snowManager.plowSweep(
        bladeX,
        bladeZ,
        v.heading,
        v.bladeWidth,
        v.speed * dt + 0.4,
        this.upgrades.saltLevel > 1
      );
    }

    if (clearedInSweep > 0) {
      // Add combo & score
      this.registerPlowedSnow(clearedInSweep);
    }

    // Update Audio
    synthAudio.updateVehicleAudio(
      Math.abs(v.speed) / maxSpeed,
      clearedInSweep > 0,
      v.isBoosting
    );
  }

  private registerPlowedSnow(cellCount: number) {
    const c = this.stats.combo;
    c.streak += cellCount;
    c.timer = 2.4; // 2.4 seconds grace period

    // Ramp multiplier
    if (c.streak >= 120) {
      c.multiplier = 10.0;
      c.label = '⚡ AVALANCHE CLEAR! ⚡';
    } else if (c.streak >= 80) {
      c.multiplier = 5.0;
      c.label = '❄️ FROST TYCOON! ❄️';
    } else if (c.streak >= 45) {
      c.multiplier = 3.0;
      c.label = 'BLIZZARD BUSTER!';
    } else if (c.streak >= 20) {
      c.multiplier = 2.0;
      c.label = 'SNOW DRIFTER!';
    } else if (c.streak >= 8) {
      c.multiplier = 1.5;
      c.label = 'CLEAN SWEEP';
    } else {
      c.multiplier = 1.0;
      c.label = 'Plowing';
    }

    c.maxCombo = Math.max(c.maxCombo, c.multiplier);

    // Audio chime scaling
    synthAudio.playComboChime(c.multiplier, c.streak);

    // Score & Coins
    const points = Math.round(cellCount * 10 * c.multiplier);
    this.stats.score += points;
    c.lastPointsAdded = points;

    // Coins earned (approx 1 coin per 4 cells + combo bonus)
    const earnedCoins = Math.max(1, Math.round(cellCount * 0.35 * (c.multiplier >= 2.0 ? 1.5 : 1.0)));
    this.stats.coins += earnedCoins;

    // Reputation gain for clean sweeps
    this.reputation.score = Math.min(100, this.reputation.score + cellCount * 0.025);
    this.reputation.roadsCleanedCount += cellCount;
  }

  private updateCombo(dt: number) {
    const c = this.stats.combo;
    if (c.timer > 0) {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.streak = 0;
        c.multiplier = 1.0;
        c.label = '';
      }
    }
  }

  private checkObstacleCollisions() {
    const v = this.vehicleState;
    const now = performance.now();

    for (const obs of this.obstacleMeshes) {
      if (!obs.active) continue;

      const dist = Math.hypot(v.x - obs.x, v.z - obs.z);
      const hitDist = obs.radius + 1.1;

      if (dist < hitDist) {
        // Collectibles
        if (obs.type === 'pickup_star' || obs.type === 'pickup_cocoa') {
          obs.active = false;
          obs.mesh.visible = false;
          this.stats.starsCollected++;
          this.stats.coins += 50;
          this.stats.score += 500;
          this.addReputationIncident(
            obs.type === 'pickup_star' ? '🌟 Golden Winter Star Found!' : '☕ Warm Cocoa Delivered!',
            +4
          );
          synthAudio.playPickup();
          continue;
        }

        // Hard collisions (Cabins, Lamps, Fences, Snowmen)
        if (now - this.lastCollisionTime > 600) {
          this.lastCollisionTime = now;
          this.cameraShake = 0.35;
          v.speed = -v.speed * 0.45; // bounce back
          synthAudio.playSoftBump();

          if (obs.type === 'fence' || obs.type === 'cabin') {
            this.reputation.propertyDamageCount++;
            this.addReputationIncident('⚠️ Property Damage: Avoid striking fences/porches!', -3);
          } else if (obs.type === 'lamp') {
            this.reputation.propertyDamageCount++;
            this.addReputationIncident('💡 Town Fixture Struck: Careful around lamp posts!', -4);
          } else if (obs.type === 'snowman') {
            // Friendly snowman wobble
            obs.mesh.rotation.z = 0.2;
            setTimeout(() => {
              obs.mesh.rotation.z = 0;
            }, 300);
            this.addReputationIncident('⛄ Bumped a Snowman! (Gentle plowing required)', -1);
          }
        }
      }
    }
  }

  private updateTownEvents(dt: number) {
    if (this.stats.activeEvent) {
      const evt = this.stats.activeEvent;
      evt.timeRemaining -= dt;

      // Check event completion condition (e.g. road cleared percentage progress)
      if (this.snowManager.getClearedPercentage() >= 70 && !evt.completed) {
        evt.completed = true;
        this.stats.coins += evt.bonusReward;
        this.stats.score += 1500;
        this.addReputationIncident(`🏆 Event Complete: ${evt.title}!`, evt.reputationBonus);
        synthAudio.playUpgradeFanfare();
      }

      if (evt.timeRemaining <= 0 || evt.completed) {
        this.stats.activeEvent = null;
        this.nextEventCountdown = 35 + Math.random() * 25;
      }
    } else {
      this.nextEventCountdown -= dt;
      if (this.nextEventCountdown <= 0) {
        this.triggerRandomTownEvent();
      }
    }
  }

  private triggerRandomTownEvent() {
    const events: Omit<TownEvent, 'timeRemaining' | 'completed' | 'active'>[] = [
      {
        id: 'school_bus',
        title: 'School Bus Route Alert!',
        description: 'Morning bell is approaching! Clear roads quickly so the bus can pass.',
        targetArea: 'Main Crossroads',
        bonusReward: 120,
        reputationBonus: 8,
        durationSeconds: 45,
      },
      {
        id: 'bakery_delivery',
        title: 'Warm Cinnamon Bakery Rush',
        description: 'Bakery flour delivery is waiting at the south driveway. Clear the drift!',
        targetArea: 'Cabin Driveways',
        bonusReward: 90,
        reputationBonus: 6,
        durationSeconds: 40,
      },
      {
        id: 'blizzard_watch',
        title: 'Council Blizzard Response',
        description: 'Severe flurry warning in effect. Keep overall road clearance above 75%.',
        targetArea: 'All Corridors',
        bonusReward: 160,
        reputationBonus: 10,
        durationSeconds: 50,
      },
    ];

    const pick = events[Math.floor(Math.random() * events.length)];
    this.stats.activeEvent = {
      ...pick,
      timeRemaining: pick.durationSeconds,
      completed: false,
      active: true,
    };
    synthAudio.playBoost();
  }

  private checkLevelCompletion() {
    const currentPct = this.snowManager.getClearedPercentage();
    const targetPct = this.currentLevel.config.targetClearPct;

    if (currentPct >= targetPct) {
      this.addReputationIncident(`🎉 Level Goal Achieved! (${currentPct.toFixed(0)}% Cleared)`, +10);
      synthAudio.playUpgradeFanfare();
      this.setGameState('level_complete');
    }
  }

  private updateCameraFollow(dt: number) {
    const v = this.vehicleState;
    const isoDist = 38;

    // Camera smoothly follows vehicle
    this._vehiclePos.set(v.x, 0, v.z);
    this._camTarget.lerp(this._vehiclePos, 8 * dt);

    // Apply camera shake if active
    let shakeX = 0;
    let shakeZ = 0;
    if (this.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShake * 1.5;
      shakeZ = (Math.random() - 0.5) * this.cameraShake * 1.5;
      this.cameraShake = Math.max(0, this.cameraShake - 1.8 * dt);
    }

    this.camera.position.set(
      this._camTarget.x + isoDist + shakeX,
      isoDist * 1.05,
      this._camTarget.z + isoDist + shakeZ
    );
    this.camera.lookAt(this._camTarget.x, 0, this._camTarget.z);
  }

  public dispose() {
    this.snowManager.dispose();
    synthAudio.stopAll();
  }
}
