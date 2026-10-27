/**
 * Pause Menu Modal for Nigul Bird.
 */

import React from 'react';
import { Play, RotateCcw, Home, Mic, MicOff, Music } from 'lucide-react';
import { GameSettings } from '../types/game';

interface Props {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  settings: GameSettings;
  onToggleMusic: () => void;
  onToggleVoice: () => void;
}

export const PauseModal: React.FC<Props> = ({
  isOpen,
  onResume,
  onRestart,
  onMainMenu,
  settings,
  onToggleMusic,
  onToggleVoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl text-white arcade-box text-center">
        
        <h2 className="font-arcade text-lg text-amber-400 tracking-wider mb-2">
          PAUSED
        </h2>
        <p className="text-xs font-mono text-slate-400 mb-6">
          Catch your breath! Press Resume or Space to continue.
        </p>

        {/* Quick audio toggles */}
        <div className="flex items-center justify-center gap-3 mb-6 p-2 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={onToggleMusic}
            className={`p-2 rounded-lg text-xs font-arcade flex items-center gap-1.5 transition-colors ${
              settings.musicEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
            }`}
            title="Toggle Music"
          >
            <Music className="w-3.5 h-3.5" />
            <span>BGM</span>
          </button>

          <button
            onClick={onToggleVoice}
            className={`p-2 rounded-lg text-xs font-arcade flex items-center gap-1.5 transition-colors ${
              settings.voiceEnabled ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-800 text-slate-500'
            }`}
            title="Toggle Nigul Voice"
          >
            {settings.voiceEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>NIGUL</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-arcade text-xs rounded-xl arcade-btn flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-arcade text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART LEVEL</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-arcade text-[11px] rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
