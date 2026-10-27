/**
 * Title Menu Screen for Nigul Bird.
 * Features:
 * - Bespoke inline SVG retro title lockup
 * - Play button
 * - Level Selection button
 * - Character Customization button
 * - Audio & Settings button
 * - Overall best score display and unlocked level indicator
 * - Keyboard & touch hints
 */

import React from 'react';
import { Play, Trophy, Sparkles, Sliders, Volume2, Mic, Info } from 'lucide-react';
import { PlayerProgress, GameSettings, CustomCharacter } from '../types/game';

interface Props {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenCustomizer: () => void;
  onOpenSettings: () => void;
  onOpenInstructions: () => void;
  progress: PlayerProgress;
  settings: GameSettings;
  character: CustomCharacter | null;
}

export const TitleMenu: React.FC<Props> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenCustomizer,
  onOpenSettings,
  onOpenInstructions,
  progress,
  settings,
  character,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden z-20 pointer-events-auto">
      
      {/* Top Bar: Settings, Instructions & Stats */}
      <div className="flex items-center justify-between gap-3">
        {/* Career Trophy */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 backdrop-blur-xs">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-mono text-slate-400">BEST SCORE</span>
            <span className="font-arcade text-xs text-amber-300 tabular-nums">
              {progress.overallBestScore}
            </span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInstructions}
            className="w-9 h-9 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="How to Play"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Title Lockup & Character Centerpiece */}
      <div className="flex flex-col items-center justify-center my-auto text-center">
        
        {/* Bespoke SVG Title Lockup */}
        <div className="relative mb-3 flex flex-col items-center">
          <svg className="w-64 sm:w-80 h-16 sm:h-20" viewBox="0 0 320 80" fill="none">
            {/* Drop shadow */}
            <text
              x="160"
              y="52"
              textAnchor="middle"
              className="font-arcade"
              fill="#0f172a"
              fontSize="34"
              fontWeight="900"
              letterSpacing="2"
            >
              NIGUL BIRD
            </text>
            {/* Outline */}
            <text
              x="158"
              y="50"
              textAnchor="middle"
              className="font-arcade"
              stroke="#000000"
              strokeWidth="6"
              fill="none"
              fontSize="34"
              fontWeight="900"
              letterSpacing="2"
            >
              NIGUL BIRD
            </text>
            {/* Main gradient text */}
            <text
              x="158"
              y="50"
              textAnchor="middle"
              className="font-arcade"
              fill="#fde047"
              fontSize="34"
              fontWeight="900"
              letterSpacing="2"
            >
              NIGUL BIRD
            </text>
          </svg>

          <div className="flex items-center gap-2 -mt-2">
            <span className="font-arcade text-[10px] text-amber-300 tracking-wider bg-black/60 px-3 py-1 rounded-full border border-amber-400/30">
              NOSTALGIC ARCADE ADVENTURE
            </span>
          </div>
        </div>

        {/* Character Preview Button */}
        <button
          onClick={onOpenCustomizer}
          className="group relative my-3 p-2 bg-slate-950/80 hover:bg-slate-900 border border-amber-400/50 hover:border-amber-400 rounded-2xl flex items-center gap-3 transition-all duration-200 active:scale-95 shadow-lg"
          title="Customize or Upload Character Image"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
            {character?.dataUrl ? (
              <img
                src={character.dataUrl}
                alt="Character"
                className="w-10 h-10 object-contain rounded-full"
              />
            ) : (
              <div className="w-8 h-7 bg-amber-500 rounded-full border border-black flex items-center justify-center relative">
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full">
                  <div className="w-1 h-1 bg-black rounded-full ml-1" />
                </div>
                <div className="absolute -right-1 top-2.5 w-2 h-1.5 bg-orange-600" />
              </div>
            )}
          </div>
          <div className="text-left pr-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-arcade text-[10px] text-amber-300">
                {character?.dataUrl ? character.name : 'CUSTOMIZE HERO'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Upload custom photo or skin
            </span>
          </div>
        </button>

        {/* Signature Voice Banner */}
        {settings.voiceEnabled && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-400/30 px-3 py-1 rounded-full mb-5">
            <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Signature "Nigul" voice active on flap!</span>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="w-full max-w-xs space-y-3">
          {/* PLAY BUTTON */}
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade text-sm rounded-2xl arcade-btn flex items-center justify-center gap-3 font-extrabold shadow-2xl"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>PLAY NOW</span>
          </button>

          {/* LEVEL SELECTION */}
          <button
            onClick={onOpenLevelSelect}
            className="w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-slate-200 font-arcade text-xs rounded-xl flex items-center justify-between transition-colors shadow-md"
          >
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>STAGES (1–10)</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400 tabular-nums">
              {progress.unlockedLevel}/10 UNLOCKED
            </span>
          </button>

          {/* UPLOAD / CUSTOMIZE CHARACTER BUTTON */}
          <button
            onClick={onOpenCustomizer}
            className="w-full py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 font-arcade text-[11px] rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>UPLOAD YOUR CHARACTER</span>
          </button>
        </div>

      </div>

      {/* Bottom Hint */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400/90 pt-2 border-t border-slate-800/80 gap-2">
        <span>Desktop: SPACE / CLICK · Mobile: TAP SCREEN</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>BGM {settings.musicEnabled ? 'ON' : 'OFF'}</span>
          </span>
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3 text-amber-400" />
            <span>VOICE {settings.voiceEnabled ? 'ON' : 'OFF'}</span>
          </span>
        </div>
      </div>

    </div>
  );
};
