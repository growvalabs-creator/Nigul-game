/**
 * Instructions & Game Guide Modal for Nigul Bird.
 */

import React from 'react';
import { HelpCircle, X, Mic, Trophy, Sparkles, Gamepad2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl text-white arcade-box">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="font-arcade text-sm sm:text-base text-amber-400 tracking-wider">
              HOW TO PLAY
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

        {/* Content */}
        <div className="my-5 space-y-4 text-xs font-mono text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-arcade text-[11px] text-amber-300 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span>FLIGHT CONTROLS</span>
            </div>
            <p>• Desktop: Click anywhere, press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-arcade text-[9px]">SPACE</kbd>, or press Arrow Up.</p>
            <p>• Mobile: Tap anywhere on the screen.</p>
            <p>• Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-arcade text-[9px]">ESC</kbd> or the Pause button in the top right to pause.</p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl space-y-1.5">
            <div className="font-arcade text-[11px] text-amber-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-amber-400" />
              <span>THE "NIGUL" SIGNATURE VOICE</span>
            </div>
            <p>• Every single jump triggers a snappy vocal "Nigul!" call.</p>
            <p>• Toggle the voice or fine-tune its volume in the Audio & Settings menu.</p>
            <p>• Switch between Retro Formant Voice (instant offline) or Speech Synthesizer anytime.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-arcade text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>10-LEVEL PROGRESSION</span>
            </div>
            <p>• Pass the required number of pipes in each stage to unlock the next level.</p>
            <p>• Progress through First Flight, Pixel Dreams, Golden Sunset, Retro Night, Neon Skies, and the ultimate Level 10 Nigul Master!</p>
            <p>• Your unlocked levels and high scores are automatically saved locally.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-arcade text-[11px] text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>CUSTOM CHARACTER UPLOADS</span>
            </div>
            <p>• Click "UPLOAD YOUR CHARACTER" to choose any PNG, JPG, or WEBP from your local device storage.</p>
            <p>• Transparent PNGs render as authentic custom flying sprites.</p>
            <p>• Stored in your browser's IndexedDB so your hero is remembered after refreshing!</p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-arcade text-xs rounded-xl arcade-btn font-bold"
          >
            Got It!
          </button>
        </div>

      </div>
    </div>
  );
};
