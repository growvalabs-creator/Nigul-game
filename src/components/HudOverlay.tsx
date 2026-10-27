/**
 * In-Game Low-Occlusion HUD Overlay for Nigul Bird.
 * Keeps >85% of playfield clear, shows current score, level, progress to goal,
 * best score, pause button, and voice status.
 */

import React from 'react';
import { Pause, Trophy, Mic } from 'lucide-react';
import { LevelConfig, GameSettings } from '../types/game';

interface Props {
  score: number;
  bestScore: number;
  level: LevelConfig;
  settings: GameSettings;
  onPause: () => void;
  voiceTriggerCount: number;
}

export const HudOverlay: React.FC<Props> = ({
  score,
  bestScore,
  level,
  settings,
  onPause,
  voiceTriggerCount,
}) => {
  const percentToTarget = Math.min(Math.round((score / level.targetScore) * 100), 100);

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 flex flex-col justify-between select-none">
      
      {/* Top Bar Cluster */}
      <div className="flex items-start justify-between gap-2">
        
        {/* Left: Level & Goal */}
        <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 shadow-lg backdrop-blur-xs flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-arcade text-[10px] text-amber-400">
              LVL {level.id}
            </span>
            <span className="text-[10px] font-mono text-slate-300 truncate max-w-[120px] sm:max-w-none">
              {level.theme.name}
            </span>
          </div>

          {/* Goal progress */}
          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-200"
                style={{ width: `${percentToTarget}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {score}/{level.targetScore}
            </span>
          </div>
        </div>

        {/* Center: Main Score Readout */}
        <div className="flex flex-col items-center">
          <div className="font-arcade text-3xl sm:text-4xl text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tabular-nums tracking-wider">
            {score}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 drop-shadow">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="tabular-nums">BEST: {Math.max(score, bestScore)}</span>
          </div>
        </div>

        {/* Right: Controls & Voice Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {settings.voiceEnabled && (
            <div
              key={voiceTriggerCount}
              className="hidden sm:flex items-center gap-1 bg-amber-500/20 border border-amber-400/50 px-2 py-1 rounded-lg text-[9px] font-arcade text-amber-300 animate-pulse"
              title="Voice Enabled: Playing 'Nigul' on jump!"
            >
              <Mic className="w-3 h-3 text-amber-400" />
              <span>NIGUL</span>
            </div>
          )}

          <button
            onClick={onPause}
            className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-slate-200 hover:text-white shadow-lg transition-transform active:scale-95"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5 fill-slate-200" />
          </button>
        </div>

      </div>

      {/* Bottom Hint */}
      <div className="text-center">
        <span className="text-[10px] font-mono text-slate-300/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
          TAP · CLICK · SPACE to jump
        </span>
      </div>

    </div>
  );
};
