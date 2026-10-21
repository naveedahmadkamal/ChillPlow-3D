export type GameState = 'title' | 'playing' | 'paused' | 'level_complete' | 'game_over' | 'garage';

export type WeatherIntensity = 'flurries' | 'moderate' | 'blizzard' | 'calm';

export interface WeatherState {
  intensity: WeatherIntensity;
  intensityFactor: number; // 0.1 (flurries) to 1.0 (blizzard)
  name: string;
  icon: string;
  desc: string;
  windAngle: number;
  windSpeed: number;
  accumulationRate: number; // cells per second that re-accumulate
  timeRemainingInWeather: number;
  blizzardWarning: boolean;
}

export interface PlowDecal {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlockedAtReputation: number;
  primaryColor?: string;
}

export interface VehicleUpgrades {
  bladeLevel: number;     // 1 to 4: Blade width & snow clearing power
  engineLevel: number;    // 1 to 4: Top speed & acceleration
  blowerLevel: number;    // 1 to 4: Snow throw distance & side-blast
  saltLevel: number;      // 1 to 4: Salt spreader melting residual ice
  gripLevel: number;      // 1 to 4: Traction and drift stability
  colorScheme: string;    // 'nordic-red' | 'tangerine' | 'aurora-teal' | 'golden-legend' | 'minty' | 'midnight'
  bladeColor: string;     // color key
  decalId: string;        // 'none' | 'racing-stripes' | 'snowflakes' | 'hazard' | 'peaks' | 'plaid'
}

export interface TownReputation {
  score: number;          // 0 to 100
  rankTitle: string;
  incidents: { text: string; delta: number; timestamp: number }[];
  roadsCleanedCount: number;
  propertyDamageCount: number;
  rescuedCabins: number;
}

export interface TownEvent {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  bonusReward: number;
  reputationBonus: number;
  durationSeconds: number;
  timeRemaining: number;
  completed: boolean;
  active: boolean;
}

export interface UpgradeConfig {
  id: keyof Omit<VehicleUpgrades, 'colorScheme' | 'bladeColor' | 'decalId'>;
  name: string;
  desc: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  statName: string;
  getStatDisplay: (level: number) => string;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  requiredReputation: number;
  gridSize: { width: number; height: number };
  targetClearPct: number;
  timeParSeconds: number;
  snowDriftCount: number;
  cabinCount: number;
  bonusPickups: number;
  difficultyColor: string;
  description: string;
  unlocked: boolean;
}

export interface VehicleState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  heading: number; // radians
  steerAngle: number;
  speed: number;
  isBoosting: boolean;
  boostFuel: number; // 0 to 100
  isDrifting: boolean;
  bladeWidth: number;
}

export interface ComboState {
  multiplier: number;
  streak: number;
  timer: number;
  maxCombo: number;
  lastPointsAdded: number;
  label: string;
}

export interface GameStats {
  score: number;
  coins: number;
  clearedSnowCount: number;
  totalSnowCount: number;
  clearedPercent: number;
  elapsedTime: number;
  combo: ComboState;
  starsCollected: number;
  reputation: TownReputation;
  weather: WeatherState;
  activeEvent: TownEvent | null;
}
