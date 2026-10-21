import React from 'react';
import { GameStats, LevelConfig, VehicleState } from '../types/game';
import { WeatherIndicator } from './WeatherIndicator';
import { ReputationBadge } from './ReputationBadge';

interface GameHUDProps {
  stats: GameStats;
  levelConfig: LevelConfig;
  vehicleState: VehicleState;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  levelConfig,
  vehicleState,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  const combo = stats.combo;
  const targetPct = levelConfig.targetClearPct;
  const currentPct = stats.clearedPercent;
  const progressRatio = Math.min(1.0, currentPct / targetPct);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Row: Perimeter Clusters */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Level Goal & Town Reputation */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Level Header Card */}
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-none text-white min-w-56">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-sky-300">{levelConfig.name}</span>
              <span className="text-[11px] font-semibold text-slate-300 tabular-nums">
                {currentPct.toFixed(1)}% / {targetPct}%
              </span>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700 mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  currentPct >= targetPct
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                    : 'bg-gradient-to-r from-sky-400 to-blue-500'
                }`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Goal: Clear {targetPct}% snow</span>
              <span className="tabular-nums">
                ❄️ {stats.clearedSnowCount} / {stats.totalSnowCount}
              </span>
            </div>
          </div>

          {/* Reputation Badge */}
          <ReputationBadge reputation={stats.reputation} />
        </div>

        {/* Center Top: Town Emergency Event Alert */}
        {stats.activeEvent && (
          <div className="pointer-events-auto px-4 py-2 rounded-2xl bg-amber-950/90 border-2 border-amber-500 text-white shadow-2xl flex items-center gap-3 max-w-md animate-pulse">
            <div className="text-2xl">🚨</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {stats.activeEvent.title}
                </span>
                <span className="text-xs font-bold text-amber-400 tabular-nums">
                  {Math.ceil(stats.activeEvent.timeRemaining)}s
                </span>
              </div>
              <div className="text-[11px] text-amber-100">{stats.activeEvent.description}</div>
            </div>
          </div>
        )}

        {/* Top-Right: Weather Barometer & Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-white flex items-center justify-center text-sm shadow cursor-pointer transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onPause}
              className="px-3 h-9 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-white flex items-center gap-1.5 text-xs font-bold shadow cursor-pointer transition-colors"
            >
              <span>⏸️</span>
              <span className="hidden sm:inline">Pause</span>
            </button>
          </div>

          {/* Dynamic Weather Barometer */}
          <WeatherIndicator weather={stats.weather} />
        </div>
      </div>

      {/* Mid/Right Floating: Combo Multiplier Cluster */}
      {combo.streak > 0 && (
        <div className="self-end mr-2 md:mr-6 pointer-events-none transition-all duration-150 transform scale-100">
          <div className="px-4 py-3 rounded-2xl bg-slate-900/90 border-2 border-amber-400/80 shadow-2xl flex flex-col items-center gap-1 text-center min-w-44">
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
              {combo.label || 'Combo Streak'}
            </div>
            <div className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 tabular-nums">
              x{combo.multiplier.toFixed(1)}
            </div>
            <div className="text-xs font-bold text-slate-200 tabular-nums">
              {combo.streak} Snow Cells Plowing
            </div>

            {/* Decaying Combo Timer Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, (combo.timer / 2.4) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status: Boost & Speedometer */}
      <div className="flex items-end justify-between w-full pb-14 md:pb-16 pointer-events-none">
        {/* Left: Speedometer & Boost Fuel */}
        <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl text-white min-w-48 pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-slate-400">Nitro Boost</span>
            <span className="text-cyan-400 font-mono tabular-nums">
              {Math.round(vehicleState.boostFuel)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                vehicleState.isBoosting
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-200 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${vehicleState.boostFuel}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1.5">
            <span className="text-slate-400">Plow Speed</span>
            <span className="font-mono font-bold text-white tabular-nums">
              {(Math.abs(vehicleState.speed) * 3.6).toFixed(0)} km/h
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl text-white text-right pointer-events-auto">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plowing Score</div>
          <div className="text-xl font-extrabold text-white tabular-nums">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-300 flex items-center justify-end gap-1 font-semibold mt-0.5">
            <span>🌟 {stats.starsCollected}</span>
            <span>·</span>
            <span>🪙 {stats.coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
