import React from 'react';
import { TownReputation } from '../types/game';

interface ReputationBadgeProps {
  reputation: TownReputation;
}

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({ reputation }) => {
  const getRankColor = () => {
    if (reputation.score >= 90) return 'text-amber-300 border-amber-400 bg-amber-950/70';
    if (reputation.score >= 75) return 'text-purple-300 border-purple-400 bg-purple-950/70';
    if (reputation.score >= 50) return 'text-sky-300 border-sky-400 bg-sky-950/70';
    if (reputation.score >= 25) return 'text-emerald-300 border-emerald-400 bg-emerald-950/70';
    return 'text-slate-300 border-slate-400 bg-slate-900/70';
  };

  const latestIncident = reputation.incidents[0];
  const isRecent = latestIncident && Date.now() - latestIncident.timestamp < 3500;

  return (
    <div className="flex flex-col gap-1 select-none pointer-events-auto">
      <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 shadow-md ${getRankColor()}`}>
        <div className="text-xl">🎖️</div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Town Reputation</span>
            <span className="text-xs font-bold tabular-nums">
              {Math.round(reputation.score)}%
            </span>
          </div>
          <div className="text-xs font-semibold text-white tracking-wide">
            {reputation.rankTitle}
          </div>
        </div>
      </div>

      {/* Floating incident alert pill */}
      {isRecent && (
        <div
          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 shadow transition-all duration-300 ${
            latestIncident.delta > 0
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500'
              : 'bg-rose-900/90 text-rose-200 border-rose-500'
          }`}
        >
          <span>{latestIncident.delta > 0 ? '▲' : '▼'}</span>
          <span>{latestIncident.text}</span>
        </div>
      )}
    </div>
  );
};
