import React from 'react';
import { GameStats, LevelConfig } from '../types/game';

interface TitleScreenProps {
  levels: LevelConfig[];
  currentLevelId: number;
  stats: GameStats;
  onStartGame: () => void;
  onSelectLevel: (index: number) => void;
  onOpenGarage: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  levels,
  currentLevelId,
  stats,
  onStartGame,
  onSelectLevel,
  onOpenGarage,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 md:p-12 pointer-events-none select-none">
      {/* Top Header / Spec Badge */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-sky-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <span>❄️</span>
          <span>WINTER PATROL v2.4</span>
          <span>·</span>
          <span className="text-slate-300">Cozy 3D Isometric Sim</span>
        </div>

        <button
          onClick={onOpenGarage}
          className="px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
        >
          <span>🎨</span>
          <span>Garage & Customizer</span>
        </button>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup over 35% Negative Space */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        {/* Bespoke Inline SVG Logo */}
        <div className="mb-4">
          <svg
            className="w-72 sm:w-96 md:w-[480px] h-auto drop-shadow-2xl"
            viewBox="0 0 500 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft background glow */}
            <defs>
              <linearGradient id="snowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
              <linearGradient id="plowGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* Snow Plow Blade Silhouette Accent */}
            <path
              d="M 60 115 C 180 128 320 128 440 115 L 430 102 C 320 112 180 112 70 102 Z"
              fill="url(#plowGold)"
              filter="url(#shadow)"
            />

            {/* Main Word: CHILL */}
            <text
              x="250"
              y="58"
              textAnchor="middle"
              fontFamily="Fredoka, system-ui, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="6"
              fill="url(#snowGrad)"
              stroke="#0f172a"
              strokeWidth="4"
              filter="url(#shadow)"
            >
              CHILLPLOW
            </text>

            {/* Sub Word: 3D SNOW SWEEPER */}
            <text
              x="250"
              y="92"
              textAnchor="middle"
              fontFamily="Fredoka, system-ui, sans-serif"
              fontWeight="700"
              fontSize="20"
              letterSpacing="8"
              fill="url(#plowGold)"
              stroke="#0f172a"
              strokeWidth="2"
            >
              ISOMETRIC SNOW PATROL
            </text>

            {/* Snowflake Decorative Motifs */}
            <circle cx="95" cy="52" r="3" fill="#bae6fd" />
            <circle cx="405" cy="52" r="3" fill="#bae6fd" />
          </svg>
        </div>

        <p className="text-sm md:text-base text-slate-200 max-w-md font-medium drop-shadow mb-6">
          Clear snowy mountain roads, keep town driveways open during blizzards, rack up combo multipliers, and earn town reputation!
        </p>

        {/* Primary Start CTA */}
        <div className="flex flex-col items-center gap-3 pointer-events-auto">
          <button
            onClick={onStartGame}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-lg md:text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-3 border-2 border-amber-300"
          >
            <span>🚜</span>
            <span>START PLOWING</span>
            <span className="text-xs bg-black/20 text-slate-950 font-bold px-2 py-0.5 rounded-md">
              SPACE / ENTER
            </span>
          </button>

          {/* Level Selector Pills */}
          <div className="flex items-center gap-2 mt-2">
            {levels.map((lvl, idx) => {
              const isUnlocked = stats.reputation.score >= lvl.requiredReputation;
              const isSelected = lvl.id === currentLevelId;

              return (
                <button
                  key={lvl.id}
                  disabled={!isUnlocked}
                  onClick={() => onSelectLevel(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400'
                      : isUnlocked
                      ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700 cursor-pointer'
                      : 'bg-slate-950/60 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                  }`}
                >
                  {lvl.name} {!isUnlocked && '🔒'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flat Control-Hint Line per Game Craft guidelines */}
      <div className="flex justify-center w-full pointer-events-auto">
        <div className="px-5 py-2 rounded-full bg-slate-900/85 border border-slate-700/80 text-xs text-slate-300 font-mono tracking-wide shadow-xl flex items-center gap-2">
          <span>WASD / Arrows Steer</span>
          <span>·</span>
          <span>Space Boost</span>
          <span>·</span>
          <span>H Garage / Upgrades</span>
          <span>·</span>
          <span>Esc Pause</span>
        </div>
      </div>
    </div>
  );
};
