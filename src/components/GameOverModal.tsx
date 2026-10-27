/**
 * Game Over Modal for Nigul Bird.
 */

import React from 'react';
import { RotateCcw, Home, Trophy, Skull } from 'lucide-react';
import { LevelConfig } from '../types/game';

interface Props {
  isOpen: boolean;
  score: number;
  bestScore: number;
  level: LevelConfig;
  onRetry: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  isOpen,
  score,
  bestScore,
  level,
  onRetry,
  onMainMenu,
}) => {
  if (!isOpen) return null;

  const isNewRecord = score > bestScore;
  const progressPercent = Math.min(Math.round((score / level.targetScore) * 100), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-2xl text-white arcade-box text-center">
        
        {/* Animated skull icon */}
        <div className="mx-auto w-12 h-12 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center mb-3">
          <Skull className="w-6 h-6 text-rose-400" />
        </div>

        <h2 className="font-arcade text-lg text-rose-400 tracking-wider mb-1">
          GAME OVER
        </h2>
        <p className="text-[11px] font-mono text-slate-400 mb-5">
          {level.title}
        </p>

        {/* Scorecard */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">SCORE</span>
            <span className="font-arcade text-lg text-white tabular-nums">{score}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>LEVEL BEST</span>
            </span>
            <span className="font-arcade text-sm text-amber-400 tabular-nums">
              {Math.max(score, bestScore)}
            </span>
          </div>

          {/* Level completion objective meter */}
          <div className="pt-2 text-left">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>LEVEL GOAL ({level.targetScore} PIPES)</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {isNewRecord && (
            <div className="pt-1 text-[10px] font-arcade text-amber-300 animate-pulse">
              ★ NEW PERSONAL BEST! ★
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-arcade text-xs rounded-xl arcade-btn flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            <RotateCcw className="w-4 h-4 fill-slate-950" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-arcade text-[11px] rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
