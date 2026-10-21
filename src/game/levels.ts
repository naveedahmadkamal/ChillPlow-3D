import { LevelConfig } from '../types/game';

export interface LevelObstacle {
  type: 'cabin' | 'tree' | 'lamp' | 'snowman' | 'fence' | 'pickup_star' | 'pickup_cocoa';
  x: number;
  z: number;
  rotation?: number;
  scale?: number;
  roofColor?: number;
}

export interface LevelEnvironment {
  config: LevelConfig;
  roadPaths: { x: number; z: number; width: number; length: number; isRotated?: boolean }[];
  obstacles: LevelObstacle[];
  playerSpawn: { x: number; z: number; heading: number };
}

export const LEVELS: LevelEnvironment[] = [
  {
    config: {
      id: 1,
      name: 'Frosty Hollow',
      subtitle: 'Cozy Town Center & Cabin Driveways',
      requiredReputation: 0,
      gridSize: { width: 44, height: 44 },
      targetClearPct: 75,
      timeParSeconds: 150,
      snowDriftCount: 6,
      cabinCount: 4,
      bonusPickups: 3,
      difficultyColor: 'from-emerald-500 to-teal-600',
      description: 'The first winter snow has blanketed Frosty Hollow! Clear the main avenue and cabin driveways without bumping into cozy fences.',
      unlocked: true,
    },
    roadPaths: [
      // Main crossroad
      { x: 0, z: 0, width: 5.0, length: 36, isRotated: false },
      { x: 0, z: 0, width: 5.0, length: 36, isRotated: true },
      // Cabin driveways
      { x: -10, z: -10, width: 3.5, length: 8, isRotated: false },
      { x: 10, z: -10, width: 3.5, length: 8, isRotated: false },
      { x: -10, z: 10, width: 3.5, length: 8, isRotated: false },
      { x: 10, z: 10, width: 3.5, length: 8, isRotated: false },
    ],
    obstacles: [
      // Cabins
      { type: 'cabin', x: -14, z: -10, roofColor: 0xd63031, rotation: Math.PI / 2 },
      { type: 'cabin', x: 14, z: -10, roofColor: 0x0984e3, rotation: -Math.PI / 2 },
      { type: 'cabin', x: -14, z: 10, roofColor: 0xe67e22, rotation: Math.PI / 2 },
      { type: 'cabin', x: 14, z: 10, roofColor: 0x6c5ce7, rotation: -Math.PI / 2 },
      // Street Lamps
      { type: 'lamp', x: -3.5, z: -5 },
      { type: 'lamp', x: 3.5, z: 5 },
      { type: 'lamp', x: -5, z: 3.5 },
      { type: 'lamp', x: 5, z: -3.5 },
      // Friendly snowmen
      { type: 'snowman', x: -8, z: -7 },
      { type: 'snowman', x: 8, z: 8 },
      // Fences
      { type: 'fence', x: -9, z: -3.5, rotation: 0 },
      { type: 'fence', x: -13, z: -3.5, rotation: 0 },
      { type: 'fence', x: 9, z: 3.5, rotation: 0 },
      { type: 'fence', x: 13, z: 3.5, rotation: 0 },
      // Layered pine trees
      { type: 'tree', x: -18, z: -18, scale: 1.2 },
      { type: 'tree', x: -15, z: -19, scale: 0.9 },
      { type: 'tree', x: 18, z: -17, scale: 1.1 },
      { type: 'tree', x: -17, z: 18, scale: 1.3 },
      { type: 'tree', x: 17, z: 17, scale: 1.0 },
      // Collectibles
      { type: 'pickup_cocoa', x: -11, z: -10 },
      { type: 'pickup_star', x: 11, z: 10 },
      { type: 'pickup_cocoa', x: 0, z: -16 },
    ],
    playerSpawn: { x: 0, z: 14, heading: 0 },
  },
  {
    config: {
      id: 2,
      name: 'Pine Creek Bridge',
      subtitle: 'Mountain Pass & Winding Cul-de-Sacs',
      requiredReputation: 35,
      gridSize: { width: 50, height: 50 },
      targetClearPct: 80,
      timeParSeconds: 180,
      snowDriftCount: 10,
      cabinCount: 5,
      bonusPickups: 4,
      difficultyColor: 'from-amber-500 to-orange-600',
      description: 'Mountain gales have swept Pine Creek! Keep your plow steady on the narrow bridge curves and clear out the snowed-in chalet loops.',
      unlocked: false,
    },
    roadPaths: [
      // S-curve highway
      { x: 0, z: -15, width: 5.2, length: 38, isRotated: false },
      { x: 12, z: 0, width: 5.2, length: 30, isRotated: true },
      { x: -5, z: 15, width: 5.2, length: 36, isRotated: false },
      { x: -12, z: 0, width: 4.8, length: 18, isRotated: true },
    ],
    obstacles: [
      { type: 'cabin', x: -16, z: -15, roofColor: 0x00b894 },
      { type: 'cabin', x: 18, z: -15, roofColor: 0xe17055 },
      { type: 'cabin', x: -18, z: 15, roofColor: 0x6c5ce7 },
      { type: 'cabin', x: 18, z: 15, roofColor: 0xfdcb6e },
      { type: 'lamp', x: -2, z: -12 },
      { type: 'lamp', x: 8, z: -3 },
      { type: 'lamp', x: -2, z: 12 },
      { type: 'snowman', x: 0, z: 0 },
      { type: 'snowman', x: -14, z: -8 },
      { type: 'fence', x: 0, z: -12, rotation: 0 },
      { type: 'fence', x: 4, z: -12, rotation: 0 },
      { type: 'tree', x: -20, z: -5, scale: 1.4 },
      { type: 'tree', x: 20, z: 5, scale: 1.2 },
      { type: 'pickup_star', x: 12, z: 0 },
      { type: 'pickup_cocoa', x: -5, z: 15 },
      { type: 'pickup_star', x: -16, z: -12 },
    ],
    playerSpawn: { x: -14, z: -15, heading: Math.PI / 2 },
  },
  {
    config: {
      id: 3,
      name: 'Alpine Summit & Ski Lodge',
      subtitle: 'Multi-Way Resort Plazas & Steep Drift Alleys',
      requiredReputation: 65,
      gridSize: { width: 56, height: 56 },
      targetClearPct: 82,
      timeParSeconds: 210,
      snowDriftCount: 14,
      cabinCount: 6,
      bonusPickups: 5,
      difficultyColor: 'from-blue-600 to-indigo-700',
      description: 'The highest peak in the valley! Heavy blizzards strike frequently. Manage dynamic snowfall accumulation while navigating tight resort corridors.',
      unlocked: false,
    },
    roadPaths: [
      { x: 0, z: 0, width: 7.0, length: 22, isRotated: false }, // Grand Plaza
      { x: 0, z: 0, width: 7.0, length: 22, isRotated: true },
      { x: -15, z: -15, width: 4.8, length: 22, isRotated: false },
      { x: 15, z: 15, width: 4.8, length: 22, isRotated: false },
      { x: -15, z: 15, width: 4.8, length: 22, isRotated: true },
      { x: 15, z: -15, width: 4.8, length: 22, isRotated: true },
    ],
    obstacles: [
      { type: 'cabin', x: -20, z: -15, roofColor: 0xd63031 },
      { type: 'cabin', x: 20, z: -15, roofColor: 0x0984e3 },
      { type: 'cabin', x: -20, z: 15, roofColor: 0x00b894 },
      { type: 'cabin', x: 20, z: 15, roofColor: 0xf39c12 },
      { type: 'lamp', x: -6, z: -6 },
      { type: 'lamp', x: 6, z: 6 },
      { type: 'lamp', x: -6, z: 6 },
      { type: 'lamp', x: 6, z: -6 },
      { type: 'snowman', x: 0, z: -8 },
      { type: 'snowman', x: 0, z: 8 },
      { type: 'pickup_star', x: 0, z: 0 },
      { type: 'pickup_cocoa', x: -15, z: -15 },
      { type: 'pickup_star', x: 15, z: 15 },
    ],
    playerSpawn: { x: 0, z: 18, heading: 0 },
  },
  {
    config: {
      id: 4,
      name: 'Aurora Valley (Zen Drift)',
      subtitle: 'Endless Winter Freeform Clearing & Drift Zone',
      requiredReputation: 85,
      gridSize: { width: 60, height: 60 },
      targetClearPct: 90,
      timeParSeconds: 300,
      snowDriftCount: 18,
      cabinCount: 6,
      bonusPickups: 6,
      difficultyColor: 'from-purple-600 to-pink-600',
      description: 'The ultimate snow-plowing playground under dancing auroras. Master high-speed drifts, infinite storms, and claim the Golden Snowplow legend!',
      unlocked: false,
    },
    roadPaths: [
      { x: 0, z: 0, width: 6.0, length: 48, isRotated: false },
      { x: 0, z: 0, width: 6.0, length: 48, isRotated: true },
      { x: -16, z: -16, width: 4.5, length: 20, isRotated: false },
      { x: 16, z: 16, width: 4.5, length: 20, isRotated: false },
      { x: -16, z: 16, width: 4.5, length: 20, isRotated: true },
      { x: 16, z: -16, width: 4.5, length: 20, isRotated: true },
    ],
    obstacles: [
      { type: 'cabin', x: -22, z: 0, roofColor: 0xe84393 },
      { type: 'cabin', x: 22, z: 0, roofColor: 0x00cec9 },
      { type: 'lamp', x: -10, z: 0 },
      { type: 'lamp', x: 10, z: 0 },
      { type: 'lamp', x: 0, z: -10 },
      { type: 'lamp', x: 0, z: 10 },
      { type: 'snowman', x: -12, z: -12 },
      { type: 'snowman', x: 12, z: 12 },
      { type: 'pickup_star', x: -16, z: 0 },
      { type: 'pickup_star', x: 16, z: 0 },
    ],
    playerSpawn: { x: 0, z: 20, heading: 0 },
  },
];
