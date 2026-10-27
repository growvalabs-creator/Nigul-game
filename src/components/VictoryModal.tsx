/**
 * Grand Victory Modal for conquering Level 10 (NIGUL MASTER).
 */

import React from 'react';
import { Crown, Trophy, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import { PlayerProgress } from '../types/game';

interface Props {
  isOpen: boolean;
  score: number;
  progress: PlayerProgress;
  onReplay: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<Props> = ({
  isOpen,
  score,
  progress,
  onReplay,
  onMainMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-indigo-950 border-4 border-yellow-400 rounded-3xl p-6 sm:p-8 shadow-2xl text-white arcade-box text-center">
        
        {/* Golden Trophy / Crown */}
        <div className="relative mx-auto w-20 h-20 bg-gradient-to-b from-amber-300 to-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-amber-200">
          <Crown className="w-10 h-10 text-slate-950 fill-slate-950 animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-200 animate-spin" />
        </div>

        <h2 className="font-arcade text-lg sm:text-xl text-yellow-300 tracking-wider mb-1">
          NIGUL MASTER!
        </h2>
        <p className="text-xs font-mono text-amber-200 mb-6">
          YOU HAVE CONQUERED ALL 10 LEVELS!
        </p>

        {/* Career Summary Card */}
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-yellow-400/40 mb-6 space-y-3 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>FINAL LEVEL SCORE</span>
            </span>
            <span className="font-arcade text-base text-yellow-300 tabular-nums">{score}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>OVERALL HIGH SCORE</span>
            </span>
            <span className="font-arcade text-base text-amber-400 tabular-nums">
              {Math.max(score, progress.overallBestScore)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span>TOTAL NIGUL CALLS</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {progress.totalNigulCount + score}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          <button
            onClick={onReplay}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-arcade text-xs rounded-xl arcade-btn flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-arcade text-[11px] rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
