import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, LevelConfig } from '../types/game';

interface VictoryModalProps {
  stats: GameStats;
  levelConfig: LevelConfig;
  onNextLevel: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  levelConfig,
  onNextLevel,
  onReplay,
  onMainMenu,
}) => {
  useEffect(() => {
    // Joyful winter victory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#facc15', '#f43f5e', '#ffffff'],
      });
    } catch {
      // Ignore if confetti fails
    }
  }, []);

  // Calculate 1 to 3 stars
  const earnedStars =
    stats.clearedPercent >= 95 ? 3 : stats.clearedPercent >= levelConfig.targetClearPct ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 select-none">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-400/80 shadow-2xl p-6 text-white text-center flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Badge */}
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-1">🏆</div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            Roads Cleared & Safe!
          </span>
          <h2 className="text-2xl font-black text-white">{levelConfig.name} Completed</h2>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 text-3xl">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className={`transform transition-transform ${
                star <= earnedStars ? 'scale-110 text-amber-400 drop-shadow' : 'text-slate-700 opacity-40'
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Level Stats Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-left bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
          <div className="p-2 rounded-xl bg-slate-900/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Snow Cleared</div>
            <div className="text-base font-bold text-sky-300 tabular-nums">
              {stats.clearedPercent.toFixed(1)}%
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Max Combo</div>
            <div className="text-base font-bold text-amber-300 tabular-nums">
              x{stats.combo.maxCombo.toFixed(1)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Time Taken</div>
            <div className="text-base font-bold text-slate-200 tabular-nums">
              {Math.floor(stats.elapsedTime / 60)}m {Math.floor(stats.elapsedTime % 60)}s
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Town Rep</div>
            <div className="text-base font-bold text-emerald-400 tabular-nums">
              {Math.round(stats.reputation.score)}% ({stats.reputation.rankTitle})
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onNextLevel}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-base shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            NEXT AREA →
          </button>
          <div className="flex gap-2">
            <button
              onClick={onReplay}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer transition-colors"
            >
              🔄 Replay Area
            </button>
            <button
              onClick={onMainMenu}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer transition-colors"
            >
              🏠 Town Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
