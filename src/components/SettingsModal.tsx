/**
 * Settings Modal for Nigul Bird.
 * Includes:
 * - Background music toggle & volume slider
 * - Sound effects toggle & volume slider
 * - "Nigul" voice toggle & volume slider + voice mode selector & Test button
 * - Character customization shortcut
 * - Reset Progress with confirmation dialog
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Music, RotateCcw, X, Sliders, ShieldAlert, Sparkles } from 'lucide-react';
import { GameSettings } from '../types/game';
import { AudioManager } from '../services/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetProgress: () => void;
  onOpenCustomizer: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetProgress,
  onOpenCustomizer,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const audio = AudioManager.getInstance(settings);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    audio.unlockAudio();
    audio.playNigulVoice();
  };

  const handleTestSfx = () => {
    audio.unlockAudio();
    audio.playScoreSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl text-white arcade-box">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-arcade text-sm sm:text-base text-amber-400 tracking-wider">
              AUDIO & SETTINGS
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

        {/* Settings Body */}
        <div className="my-5 space-y-5 text-xs sm:text-sm">
          
          {/* 1. Signature "Nigul" Voice (The Highlight Feature) */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-400/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.voiceEnabled ? (
                  <Mic className="w-4 h-4 text-amber-400" />
                ) : (
                  <MicOff className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <div className="font-arcade text-[11px] text-amber-300">"NIGUL" VOICE EFFECT</div>
                  <div className="text-[10px] text-slate-400">Plays every jump & flap</div>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
                className={`px-3 py-1 font-arcade text-[10px] rounded-lg transition-colors ${
                  settings.voiceEnabled
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.voiceEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {settings.voiceEnabled && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-slate-400 w-12 font-mono">VOL</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.voiceVolume}
                    onChange={(e) => onUpdateSettings({ ...settings, voiceVolume: parseFloat(e.target.value) })}
                    className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-amber-300 w-8 text-right">
                    {Math.round(settings.voiceVolume * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2 border-t border-amber-400/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Voice Engine:</span>
                    <select
                      value={settings.voiceMode}
                      onChange={(e) => onUpdateSettings({ ...settings, voiceMode: e.target.value as 'recording' | 'procedural' | 'speech' })}
                      className="bg-slate-950 border border-amber-400/30 rounded px-2 py-0.5 text-[10px] text-amber-200 outline-none"
                    >
                      <option value="recording">Recorded Voice (Uploaded)</option>
                      <option value="procedural">Retro Formant (Synthesized)</option>
                      <option value="speech">Browser Speech Synthesizer</option>
                    </select>
                  </div>

                  <button
                    onClick={handleTestVoice}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-arcade text-[9px] rounded arcade-btn flex items-center gap-1 font-bold"
                  >
                    <span>Say "Nigul!"</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 2. Background Music */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span className="font-arcade text-[11px] text-slate-200">CHIPTUNE MUSIC</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
                className={`px-3 py-1 font-arcade text-[10px] rounded-lg transition-colors ${
                  settings.musicEnabled
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {settings.musicEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-slate-400 w-12 font-mono">VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                  className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] font-mono text-emerald-300 w-8 text-right">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* 3. Sound Effects (SFX) */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.sfxEnabled ? (
                  <Volume2 className="w-4 h-4 text-sky-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span className="font-arcade text-[11px] text-slate-200">SOUND EFFECTS</span>
              </div>
              <div className="flex items-center gap-2">
                {settings.sfxEnabled && (
                  <button
                    onClick={handleTestSfx}
                    className="text-[9px] text-sky-400 hover:underline font-mono"
                  >
                    Test SFX
                  </button>
                )}
                <button
                  onClick={() => onUpdateSettings({ ...settings, sfxEnabled: !settings.sfxEnabled })}
                  className={`px-3 py-1 font-arcade text-[10px] rounded-lg transition-colors ${
                    settings.sfxEnabled
                      ? 'bg-sky-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.sfxEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {settings.sfxEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-slate-400 w-12 font-mono">VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => onUpdateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
                  className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] font-mono text-sky-300 w-8 text-right">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Character customization link button */}
          <button
            onClick={() => {
              onClose();
              onOpenCustomizer();
            }}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-arcade text-[10px] rounded-xl flex items-center justify-center gap-2 transition-colors border border-amber-400/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>CUSTOMIZE / UPLOAD CHARACTER</span>
          </button>

          {/* Reset progress */}
          <div className="pt-2 border-t border-slate-800">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 text-rose-400 hover:text-rose-300 font-arcade text-[9px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Game Progress...</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-arcade text-[10px]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Reset All Progress?</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  This will reset unlocked levels and best scores to Level 1. Settings will be kept.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-arcade rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onResetProgress();
                      setShowResetConfirm(false);
                    }}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-arcade rounded font-bold"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-arcade text-xs rounded-xl arcade-btn font-bold shadow-md"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
