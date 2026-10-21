import React from 'react';
import { WeatherState } from '../types/game';

interface WeatherIndicatorProps {
  weather: WeatherState;
}

export const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({ weather }) => {
  const getBadgeStyle = () => {
    switch (weather.intensity) {
      case 'blizzard':
        return 'bg-red-950/85 text-red-200 border-red-500/60 shadow-red-900/40';
      case 'moderate':
        return 'bg-blue-950/85 text-blue-200 border-blue-400/50 shadow-blue-900/30';
      case 'flurries':
        return 'bg-slate-900/85 text-sky-200 border-sky-400/40 shadow-slate-950/40';
      case 'calm':
      default:
        return 'bg-emerald-950/85 text-emerald-200 border-emerald-400/40 shadow-emerald-950/30';
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5 select-none pointer-events-auto">
      {/* Weather Card */}
      <div
        className={`px-3 py-2 rounded-xl border shadow-lg transition-all duration-300 flex items-center gap-2.5 ${getBadgeStyle()}`}
      >
        <div className="text-2xl leading-none">{weather.icon}</div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">{weather.name}</span>
            {weather.intensity === 'blizzard' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white uppercase animate-pulse">
                Storm
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2 tabular-nums">
            <span>Accumulation: {weather.accumulationRate.toFixed(1)}x</span>
            <span>·</span>
            <span>Shift in {Math.max(0, Math.ceil(weather.timeRemainingInWeather))}s</span>
          </div>
        </div>
      </div>

      {/* Blizzard Warning Banner */}
      {weather.blizzardWarning && (
        <div className="px-3 py-1 rounded-lg bg-amber-500/90 text-amber-950 font-bold text-xs flex items-center gap-1.5 border border-amber-300 shadow-md animate-bounce">
          <span>⚠️</span>
          <span>BLIZZARD SQUALL INBOUND IN 5s!</span>
        </div>
      )}
    </div>
  );
};
