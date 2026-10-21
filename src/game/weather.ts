import { WeatherIntensity, WeatherState } from '../types/game';

const WEATHER_PRESETS: Record<
  WeatherIntensity,
  {
    name: string;
    icon: string;
    desc: string;
    intensityFactor: number;
    accumulationRate: number; // cells re-accumulated per second
    particleSpeed: number;
    windRange: [number, number];
    durationRange: [number, number];
    fogDensity: number;
    skyColor: number;
  }
> = {
  calm: {
    name: 'Crisp & Calm',
    icon: '☀️',
    desc: 'Gentle winter sun. Minimal accumulation.',
    intensityFactor: 0.15,
    accumulationRate: 0.1,
    particleSpeed: 1.2,
    windRange: [0.1, 0.4],
    durationRange: [30, 45],
    fogDensity: 0.015,
    skyColor: 0xe0ecf8,
  },
  flurries: {
    name: 'Cozy Flurries',
    icon: '❄️',
    desc: 'Light powder falling steadily. Perfect plowing weather.',
    intensityFactor: 0.4,
    accumulationRate: 0.35,
    particleSpeed: 2.2,
    windRange: [0.3, 0.8],
    durationRange: [35, 50],
    fogDensity: 0.018,
    skyColor: 0xd6e4f0,
  },
  moderate: {
    name: 'Heavy Snowfall',
    icon: '🌨️',
    desc: 'Substantial snow accumulation. Roads need active sweeping.',
    intensityFactor: 0.75,
    accumulationRate: 0.8,
    particleSpeed: 3.5,
    windRange: [0.8, 1.8],
    durationRange: [25, 40],
    fogDensity: 0.024,
    skyColor: 0xc2d4e7,
  },
  blizzard: {
    name: 'Blizzard Squall!',
    icon: '💨❄️',
    desc: 'High winds & rapid snow buildup! Keep the roads open!',
    intensityFactor: 1.0,
    accumulationRate: 1.6,
    particleSpeed: 5.5,
    windRange: [2.0, 3.8],
    durationRange: [18, 28],
    fogDensity: 0.032,
    skyColor: 0xa9bfd6,
  },
};

export class WeatherSystem {
  public state: WeatherState;
  private currentCycleIndex = 0;
  private cycleOrder: WeatherIntensity[] = ['flurries', 'moderate', 'blizzard', 'calm'];
  private accumulationAccumulator = 0;

  constructor() {
    this.state = this.buildState('flurries');
  }

  private buildState(intensity: WeatherIntensity): WeatherState {
    const preset = WEATHER_PRESETS[intensity];
    const duration = preset.durationRange[0] + Math.random() * (preset.durationRange[1] - preset.durationRange[0]);
    const windSpeed = preset.windRange[0] + Math.random() * (preset.windRange[1] - preset.windRange[0]);
    const windAngle = (Math.random() - 0.5) * Math.PI * 0.5;

    return {
      intensity,
      intensityFactor: preset.intensityFactor,
      name: preset.name,
      icon: preset.icon,
      desc: preset.desc,
      windAngle,
      windSpeed,
      accumulationRate: preset.accumulationRate,
      timeRemainingInWeather: duration,
      blizzardWarning: false,
    };
  }

  public update(dt: number): { reaccumulateCount: number; weatherChanged: boolean } {
    let weatherChanged = false;
    this.state.timeRemainingInWeather -= dt;

    // Check for blizzard warning when 5 seconds before blizzard
    const nextIntensity = this.cycleOrder[(this.currentCycleIndex + 1) % this.cycleOrder.length];
    if (nextIntensity === 'blizzard' && this.state.timeRemainingInWeather <= 6) {
      this.state.blizzardWarning = true;
    } else {
      this.state.blizzardWarning = false;
    }

    // Time to shift weather
    if (this.state.timeRemainingInWeather <= 0) {
      this.currentCycleIndex = (this.currentCycleIndex + 1) % this.cycleOrder.length;
      const newIntensity = this.cycleOrder[this.currentCycleIndex];
      this.state = this.buildState(newIntensity);
      weatherChanged = true;
    }

    // Calculate snow re-accumulation ticks
    this.accumulationAccumulator += this.state.accumulationRate * dt;
    let reaccumulateCount = 0;
    if (this.accumulationAccumulator >= 1.0) {
      reaccumulateCount = Math.floor(this.accumulationAccumulator);
      this.accumulationAccumulator -= reaccumulateCount;
    }

    return { reaccumulateCount, weatherChanged };
  }

  public getVisualParams() {
    const preset = WEATHER_PRESETS[this.state.intensity];
    return {
      particleSpeed: preset.particleSpeed,
      fogDensity: preset.fogDensity,
      skyColor: preset.skyColor,
      windSpeed: this.state.windSpeed,
      windAngle: this.state.windAngle,
    };
  }

  public setManualWeather(intensity: WeatherIntensity) {
    this.state = this.buildState(intensity);
  }
}
