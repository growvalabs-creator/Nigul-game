/**
 * Level Selection Modal for Nigul Bird.
 * Shows all 10 levels with unlocked/locked states, target requirements,
 * high scores per level, and immediate play trigger.
 */

import React from 'react';
import { Lock, Trophy, Play, X, Star } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { LevelConfig, PlayerProgress } from '../types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onSelectLevel: (level: LevelConfig) => void;
  currentSelectedLevelId: number;
}

export const LevelSelectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  progress,
  onSelectLevel,
  currentSelectedLevelId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl text-white arcade-box flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-arcade text-sm sm:text-base text-amber-400 tracking-wider">
              SELECT LEVEL (1 — 10)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progression tracker badge */}
        <div className="my-3 py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
          <span className="text-slate-400">UNLOCKED STAGES:</span>
          <span className="text-amber-400 font-bold tabular-nums">
            {Math.min(progress.unlockedLevel, 10)} / 10
          </span>
        </div>

        {/* Level Grid (Scrollable) */}
        <div className="overflow-y-auto pr-1 space-y-2.5 my-2 flex-1 max-h-[55vh]">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= progress.unlockedLevel;
            const isCurrent = level.id === currentSelectedLevelId;
            const bestScore = progress.levelHighScores[level.id] || 0;
            const isCleared = bestScore >= level.targetScore;

            return (
              <div
                key={level.id}
                className={`relative p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    : isCurrent
                    ? 'bg-amber-500/15 border-amber-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Level info */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-arcade text-xs shrink-0 font-bold border ${
                      !isUnlocked
                        ? 'bg-slate-900 border-slate-800 text-slate-600'
                        : isCleared
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-amber-400/20 border-amber-400 text-amber-300'
                    }`}
                  >
                    {!isUnlocked ? <Lock className="w-4 h-4 text-slate-500" /> : level.id}
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-arcade text-xs text-white truncate">
                        {level.title}
                      </span>
                      {isCleared && (
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {level.subtitle} · Goal: {level.targetScore} pipes
                    </div>
                  </div>
                </div>

                {/* Status & Play Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono text-[11px] hidden sm:block">
                    <div className="text-slate-400">BEST</div>
                    <div className="text-amber-300 font-bold tabular-nums">{bestScore}</div>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        onSelectLevel(level);
                        onClose();
                      }}
                      className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-arcade text-[10px] rounded-lg arcade-btn flex items-center gap-1 font-bold shadow"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>FLY</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 py-2 px-2">
                      <Lock className="w-3 h-3" />
                      <span>LOCKED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-arcade text-xs rounded-xl"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
