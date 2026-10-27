/**
 * Level Completed Modal for Nigul Bird.
 */

import React from 'react';
import { ArrowRight, RotateCcw, Home, Sparkles, Star } from 'lucide-react';
import { LevelConfig } from '../types/game';

interface Props {
  isOpen: boolean;
  score: number;
  level: LevelConfig;
  nextLevel: LevelConfig | null;
  onContinue: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
}

export const LevelCompleteModal: React.FC<Props> = ({
  isOpen,
  score,
  level,
  nextLevel,
  onContinue,
  onReplay,
  onMainMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-emerald-400 rounded-2xl p-6 shadow-2xl text-white arcade-box text-center">
        
        {/* Animated celebration crown */}
        <div className="mx-auto w-14 h-14 bg-emerald-500/20 border border-emerald-400 rounded-full flex items-center justify-center mb-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-emerald-300" />
        </div>

        <h2 className="font-arcade text-base sm:text-lg text-emerald-400 tracking-wider mb-1">
          STAGE CLEARED!
        </h2>
        <p className="text-[11px] font-mono text-slate-300 mb-5">
          {level.title}
        </p>

        {/* 3 Golden Stars */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce delay-100" />
          <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-bounce" />
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce delay-200" />
        </div>

        {/* Stats */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">PIPES PASSED</span>
            <span className="font-arcade text-lg text-white tabular-nums">{score}</span>
          </div>

          {nextLevel ? (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-left">
              <div className="text-[10px] font-arcade text-emerald-300">
                ★ NEXT STAGE UNLOCKED:
              </div>
              <div className="text-xs font-mono text-slate-200 font-bold truncate mt-0.5">
                {nextLevel.title}
              </div>
            </div>
          ) : (
            <div className="text-xs font-arcade text-amber-300">
              ALL 10 STAGES UNLOCKED!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {nextLevel ? (
            <button
              onClick={onContinue}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-arcade text-xs rounded-xl arcade-btn flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              <span>CONTINUE TO NEXT</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={onMainMenu}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-arcade text-xs rounded-xl arcade-btn font-bold shadow-lg"
            >
              CLAIM VICTORY
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onReplay}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REPLAY</span>
            </button>

            <button
              onClick={onMainMenu}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-arcade text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>MENU</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
