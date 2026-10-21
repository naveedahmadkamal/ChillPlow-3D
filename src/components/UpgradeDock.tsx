import React, { useState } from 'react';
import { GameStats, VehicleUpgrades } from '../types/game';
import { BLADE_COLORS, COLOR_SCHEMES, PLOW_DECALS } from '../game/models';
import { UPGRADES_CONFIG } from '../game/gameEngine';
import { LEVELS } from '../game/levels';

interface UpgradeDockProps {
  stats: GameStats;
  upgrades: VehicleUpgrades;
  currentLevelId: number;
  onUpgrade: (id: keyof Omit<VehicleUpgrades, 'colorScheme' | 'bladeColor' | 'decalId'>) => void;
  onSelectColor: (colorKey: string) => void;
  onSelectBladeColor: (bladeColorKey: string) => void;
  onSelectDecal: (decalId: string) => void;
  onSelectLevel: (levelIndex: number) => void;
}

export const UpgradeDock: React.FC<UpgradeDockProps> = ({
  stats,
  upgrades,
  currentLevelId,
  onUpgrade,
  onSelectColor,
  onSelectBladeColor,
  onSelectDecal,
  onSelectLevel,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'upgrades' | 'customizer' | 'map'>('upgrades');

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out pointer-events-auto"
      style={{
        width: 'min(920px, 95vw)',
        transform: isCollapsed ? 'translate(-50%, calc(100% - 32px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-4 py-1 rounded-t-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-t border-x border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
        >
          <span>{isCollapsed ? '▲' : '▼'}</span>
          <span>{isCollapsed ? 'Show Garage & Upgrades (H)' : 'Hide Dock (H)'}</span>
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-3 text-slate-100 flex flex-col gap-2.5">
        {/* Top Header Row: Tabs & Coins */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upgrades'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              🛠️ Upgrades
            </button>
            <button
              onClick={() => setActiveTab('customizer')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'customizer'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              🎨 Customizer
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              🗺️ Town Map
            </button>
          </div>

          {/* Currency Readout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-bold tabular-nums">
              <span>🪙</span>
              <span>{stats.coins.toLocaleString()}</span>
              <span className="text-[10px] text-amber-400 font-normal">Snow Coins</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Upgrades */}
        {activeTab === 'upgrades' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {UPGRADES_CONFIG.map((conf) => {
              const currentLvl = upgrades[conf.id];
              const isMax = currentLvl >= conf.maxLevel;
              const cost = Math.floor(conf.baseCost * Math.pow(conf.costMultiplier, currentLvl - 1));
              const canAfford = stats.coins >= cost && !isMax;

              return (
                <div
                  key={conf.id}
                  className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between gap-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{conf.name}</span>
                      <span className="text-[10px] text-sky-400">
                        Lv {currentLvl}/{conf.maxLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5 flex justify-between">
                      <span className="text-slate-400">{conf.statName}:</span>
                      <span className="font-semibold text-white">{conf.getStatDisplay(currentLvl)}</span>
                    </div>
                  </div>

                  <button
                    disabled={!canAfford || isMax}
                    onClick={() => onUpgrade(conf.id)}
                    className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isMax
                        ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                        : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      'MAX'
                    ) : (
                      <>
                        <span>🪙 {cost}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Plow Customizer (Garage) */}
        {activeTab === 'customizer' && (
          <div className="flex flex-col gap-2.5">
            {/* Row 1: Truck Body Colors */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 min-w-20">Truck Paint:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(COLOR_SCHEMES).map(([key, col]) => (
                  <button
                    key={key}
                    onClick={() => onSelectColor(key)}
                    className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border transition-all cursor-pointer ${
                      upgrades.colorScheme === key
                        ? 'border-white ring-2 ring-blue-500 text-white bg-slate-800'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-800/60'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/30"
                      style={{ backgroundColor: `#${col.hex.toString(16).padStart(6, '0')}` }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Blade Colors */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 min-w-20">Blade Finish:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(BLADE_COLORS).map(([key, col]) => (
                  <button
                    key={key}
                    onClick={() => onSelectBladeColor(key)}
                    className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border transition-all cursor-pointer ${
                      upgrades.bladeColor === key
                        ? 'border-white ring-2 ring-amber-500 text-white bg-slate-800'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-800/60'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/30"
                      style={{ backgroundColor: `#${col.hex.toString(16).padStart(6, '0')}` }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Decals & Liveries (Gated by Town Reputation) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 min-w-20">Decal Livery:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PLOW_DECALS.map((dec) => {
                  const isUnlocked = stats.reputation.score >= dec.unlockedAtReputation;
                  const isSelected = upgrades.decalId === dec.id;

                  return (
                    <button
                      key={dec.id}
                      disabled={!isUnlocked}
                      onClick={() => onSelectDecal(dec.id)}
                      className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border transition-all ${
                        isSelected
                          ? 'border-white ring-2 ring-purple-500 text-white bg-slate-800 cursor-pointer'
                          : isUnlocked
                          ? 'border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-800/60 cursor-pointer'
                          : 'border-slate-800 text-slate-500 bg-slate-900/60 cursor-not-allowed opacity-60'
                      }`}
                      title={!isUnlocked ? `Requires ${dec.unlockedAtReputation}% Town Reputation` : dec.desc}
                    >
                      <span>{dec.icon}</span>
                      <span>{dec.name}</span>
                      {!isUnlocked && (
                        <span className="text-[10px] text-amber-400 ml-0.5">🔒 {dec.unlockedAtReputation}%</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Town Map & Area Unlocks */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {LEVELS.map((lvl, index) => {
              const isUnlocked = stats.reputation.score >= lvl.config.requiredReputation;
              const isCurrent = currentLevelId === lvl.config.id;

              return (
                <div
                  key={lvl.config.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                    isCurrent
                      ? 'bg-blue-950/70 border-blue-400 shadow-md ring-1 ring-blue-500'
                      : isUnlocked
                      ? 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{lvl.config.name}</span>
                      {!isUnlocked ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                          🔒 {lvl.config.requiredReputation}% Rep
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[10px] font-bold text-blue-400">ACTIVE</span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{lvl.config.subtitle}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                      <span>Goal: {lvl.config.targetClearPct}%</span>
                      <span>·</span>
                      <span>Cabins: {lvl.config.cabinCount}</span>
                    </div>
                  </div>

                  <button
                    disabled={!isUnlocked || isCurrent}
                    onClick={() => onSelectLevel(index)}
                    className={`w-full py-1 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white cursor-default'
                        : isUnlocked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isCurrent ? 'Current Area' : isUnlocked ? 'Travel to Area' : 'Locked by Town Rep'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
