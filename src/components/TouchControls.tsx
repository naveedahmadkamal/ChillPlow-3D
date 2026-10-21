import React from 'react';

interface TouchControlsProps {
  onInput: (action: 'forward' | 'backward' | 'left' | 'right' | 'boost', active: boolean) => void;
  isBoosting: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput, isBoosting }) => {
  return (
    <div className="fixed inset-x-0 bottom-16 z-20 pointer-events-none flex justify-between px-4 sm:px-8 select-none">
      {/* Steering & Drive Cluster (Bottom-Left) */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <button
          onTouchStart={() => onInput('forward', true)}
          onTouchEnd={() => onInput('forward', false)}
          onMouseDown={() => onInput('forward', true)}
          onMouseUp={() => onInput('forward', false)}
          className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-600 text-white font-bold flex items-center justify-center text-lg active:bg-blue-600 active:scale-95 shadow"
        >
          ▲
        </button>
        <div className="flex gap-2">
          <button
            onTouchStart={() => onInput('left', true)}
            onTouchEnd={() => onInput('left', false)}
            onMouseDown={() => onInput('left', true)}
            onMouseUp={() => onInput('left', false)}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-600 text-white font-bold flex items-center justify-center text-lg active:bg-blue-600 active:scale-95 shadow"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onInput('backward', true)}
            onTouchEnd={() => onInput('backward', false)}
            onMouseDown={() => onInput('backward', true)}
            onMouseUp={() => onInput('backward', false)}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-600 text-white font-bold flex items-center justify-center text-lg active:bg-blue-600 active:scale-95 shadow"
          >
            ▼
          </button>
          <button
            onTouchStart={() => onInput('right', true)}
            onTouchEnd={() => onInput('right', false)}
            onMouseDown={() => onInput('right', true)}
            onMouseUp={() => onInput('right', false)}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-600 text-white font-bold flex items-center justify-center text-lg active:bg-blue-600 active:scale-95 shadow"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Boost Action Button (Bottom-Right) */}
      <div className="pointer-events-auto flex items-end opacity-75 hover:opacity-100 transition-opacity">
        <button
          onTouchStart={() => onInput('boost', true)}
          onTouchEnd={() => onInput('boost', false)}
          onMouseDown={() => onInput('boost', true)}
          onMouseUp={() => onInput('boost', false)}
          className={`w-16 h-16 rounded-3xl border-2 font-black flex flex-col items-center justify-center text-xs shadow-2xl active:scale-95 transition-all ${
            isBoosting
              ? 'bg-cyan-500 border-cyan-300 text-slate-950 scale-105'
              : 'bg-slate-900/85 border-cyan-500/70 text-cyan-300 hover:bg-slate-800'
          }`}
        >
          <span className="text-xl">🚀</span>
          <span>BOOST</span>
        </button>
      </div>
    </div>
  );
};
