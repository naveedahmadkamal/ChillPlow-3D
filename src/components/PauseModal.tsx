import React from 'react';
import { GameStats } from '../types/game';

interface PauseModalProps {
  stats: GameStats;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  isMuted,
  onResume,
  onRestart,
  onToggleMute,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-1">⏸️</div>
          <h2 className="text-xl font-extrabold text-white">Plowing Paused</h2>
          <span className="text-xs text-slate-400">Cozy winter break</span>
        </div>

        {/* Current Standing */}
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-left text-xs flex justify-between items-center">
          <div>
            <div className="text-slate-400">Current Town Rep</div>
            <div className="font-bold text-sky-400">{stats.reputation.rankTitle}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400">Coins</div>
            <div className="font-bold text-amber-400">🪙 {stats.coins}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onResume}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow cursor-pointer transition-colors"
          >
            ▶️ Resume Plowing (Esc)
          </button>
          <button
            onClick={onToggleMute}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <span>{isMuted ? '🔇 Audio Muted' : '🔊 Audio Active'}</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
          >
            🔄 Restart Area
          </button>
          <button
            onClick={onMainMenu}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
          >
            🏠 Exit to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
