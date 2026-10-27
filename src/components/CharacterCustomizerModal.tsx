/**
 * Character Customizer Modal.
 * Supports:
 * - Native file picker for PNG, JPG/JPEG, WEBP local images
 * - Live animated preview with rotation and transparent background
 * - Image resizing/optimization via Canvas before storing to IndexedDB
 * - "UPLOAD YOUR CHARACTER" button
 * - "Apply" and "Cancel" buttons
 * - "Restore Default Character" button
 * - Helpful error messaging for corrupted or unsupported files
 * - Preset retro arcade skins
 */

import React, { useState, useRef } from 'react';
import { Upload, RotateCcw, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { CustomCharacter } from '../types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentCharacter: CustomCharacter | null;
  onSaveCharacter: (character: CustomCharacter) => Promise<void>;
  onRestoreDefault: () => Promise<void>;
}

const PRESETS = [
  { id: 'default', name: 'Original Nigul Bird', color: '#f59e0b', desc: 'Classic golden arcade flyer' },
  { id: 'cyber', name: 'Cyber Neon Glider', color: '#06b6d4', desc: 'Electric blue arcade synth hero' },
  { id: 'phoenix', name: 'Golden Phoenix', color: '#ea580c', desc: 'Fiery legendary blazing wing' },
  { id: 'midnight', name: 'Shadow Ninja', color: '#6366f1', desc: 'Stealthy purple night flyer' },
];

export const CharacterCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentCharacter,
  onSaveCharacter,
  onRestoreDefault,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCharacter?.dataUrl || null);
  const [selectedName, setSelectedName] = useState<string>(currentCharacter?.name || 'Custom Character');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please select a PNG, JPG, or WEBP image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image is too large. Please select a file under 8MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');

          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const optimizedDataUrl = canvas.toDataURL('image/png');
          setPreviewUrl(optimizedDataUrl);
          setSelectedName(file.name.replace(/\.[^/.]+$/, '').slice(0, 24));
          setIsProcessing(false);
        } catch (err) {
          setErrorMsg('Failed to process image. Please try another file.');
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMsg('The selected image could not be loaded or is corrupted.');
        setIsProcessing(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file from storage.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      const char: CustomCharacter = {
        id: 'active_character',
        name: selectedName || 'Custom Flyer',
        dataUrl: previewUrl,
        isDefault: !previewUrl,
        timestamp: Date.now(),
      };
      await onSaveCharacter(char);
      onClose();
    } catch (e) {
      setErrorMsg('Failed to save character to local storage.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreDefault = async () => {
    setIsProcessing(true);
    try {
      await onRestoreDefault();
      setPreviewUrl(null);
      setSelectedName('Nigul Bird');
      setErrorMsg(null);
      onClose();
    } catch (e) {
      setErrorMsg('Failed to restore default character.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createPresetImage = (color: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(64, 64, 52, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(88, 52, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(94, 52, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(100, 60);
    ctx.lineTo(124, 68);
    ctx.lineTo(100, 76);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(50, 68, 26, 16, -0.2, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl text-white arcade-box">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-arcade text-sm sm:text-base text-amber-400 tracking-wider">
              CHARACTER WORKSHOP
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

        {/* Live Character Preview Display */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 rounded-2xl bg-slate-950 border-2 border-dashed border-amber-400/50 flex items-center justify-center overflow-hidden shadow-inner group">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fde047_1px,transparent_1px)] [background-size:8px_8px]" />
            
            <div className="relative z-10 w-20 h-20 flex items-center justify-center animate-bounce duration-1000">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Custom Character Preview"
                  className="w-16 h-16 object-contain rounded-full border-2 border-amber-300 shadow-lg bg-black/20"
                />
              ) : (
                <div className="relative w-16 h-14 bg-amber-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                  <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-900 rounded-full ml-1" />
                  </div>
                  <div className="absolute -right-2 top-5 w-4 h-3 bg-orange-600 rounded-sm" />
                  <div className="absolute left-2 top-4 w-7 h-4 bg-white/90 rounded-full" />
                </div>
              )}
            </div>

            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-300/80 uppercase">
              {previewUrl ? 'CUSTOM' : 'DEFAULT'}
            </div>
          </div>

          <p className="mt-2 text-xs font-mono text-slate-400">
            {previewUrl ? selectedName : 'Original Nigul Bird (Procedural Mascot)'}
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-arcade rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload Photo
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-xs font-arcade rounded-lg transition-all ${
              activeTab === 'presets'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Arcade Skins
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Section */}
        {activeTab === 'upload' ? (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            {/* MANDATORY BUTTON LABEL: "UPLOAD YOUR CHARACTER" */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-arcade text-xs sm:text-sm rounded-xl arcade-btn flex items-center justify-center gap-2 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              <span>UPLOAD YOUR CHARACTER</span>
            </button>

            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <p>• Supported formats: <span className="text-amber-300">PNG, JPG, WEBP</span></p>
              <p>• Transparent PNGs work seamlessly as in-game flying sprites.</p>
              <p>• Stored safely in local IndexedDB — preserved across reloads without cloud upload.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setErrorMsg(null);
                  if (p.id === 'default') {
                    setPreviewUrl(null);
                    setSelectedName('Original Nigul Bird');
                  } else {
                    const presetUrl = createPresetImage(p.color);
                    setPreviewUrl(presetUrl);
                    setSelectedName(p.name);
                  }
                }}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-400 rounded-xl text-left transition-colors flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-full shrink-0 border border-black/40 shadow-sm"
                  style={{ backgroundColor: p.color }}
                />
                <div className="overflow-hidden">
                  <div className="font-arcade text-[10px] text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleRestoreDefault}
            disabled={isProcessing}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-arcade text-[10px] rounded-lg transition-colors flex items-center gap-1.5"
            title="Restore default game mascot"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-arcade text-[10px] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-arcade text-[10px] rounded-lg arcade-btn flex items-center gap-1.5 font-bold shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
