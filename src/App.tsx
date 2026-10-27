/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { LEVELS } from './game/levels';
import { GameState, LevelConfig, GameSettings, PlayerProgress, CustomCharacter } from './types/game';
import { StorageService, DEFAULT_SETTINGS, DEFAULT_PROGRESS } from './services/storage';
import { AudioManager } from './services/audio';

import { TitleMenu } from './components/TitleMenu';
import { HudOverlay } from './components/HudOverlay';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { VictoryModal } from './components/VictoryModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { CharacterCustomizerModal } from './components/CharacterCustomizerModal';
import { SettingsModal } from './components/SettingsModal';
import { InstructionsModal } from './components/InstructionsModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [score, setScore] = useState(0);
  const [voiceTriggerCount, setVoiceTriggerCount] = useState(0);

  // Persistence
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [customCharacter, setCustomCharacter] = useState<CustomCharacter | null>(null);

  // Modals
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // Audio manager reference
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Initialize storage & audio on mount
  useEffect(() => {
    const loadedSettings = StorageService.loadSettings();
    const loadedProgress = StorageService.loadProgress();
    setSettings(loadedSettings);
    setProgress(loadedProgress);

    const audio = AudioManager.getInstance(loadedSettings);
    audioManagerRef.current = audio;

    // Load custom character from IndexedDB
    StorageService.loadCustomCharacter().then((char) => {
      if (char) {
        setCustomCharacter(char);
        if (engineRef.current) {
          engineRef.current.setCustomCharacter(char.dataUrl);
        }
      }
    });

    // Start on highest unlocked level if appropriate, or level 1
    const initialLevelIndex = Math.min(loadedProgress.unlockedLevel - 1, LEVELS.length - 1);
    setCurrentLevel(LEVELS[initialLevelIndex]);
  }, []);

  // Sync settings with audio manager
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.updateSettings(settings);
    }
  }, [settings]);

  // Initialize Canvas Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, currentLevel);
    engineRef.current = engine;

    if (customCharacter) {
      engine.setCustomCharacter(customCharacter.dataUrl);
    }

    // Engine Event Callbacks
    engine.onJumpTriggered = () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.playJumpSound();
        audioManagerRef.current.playNigulVoice();
      }
      setVoiceTriggerCount((c) => c + 1);

      // Increment total stats quietly
      setProgress((prev) => {
        const updated = {
          ...prev,
          totalJumps: prev.totalJumps + 1,
          totalNigulCount: prev.totalNigulCount + 1,
        };
        StorageService.saveProgress(updated);
        return updated;
      });
    };

    engine.onScoreChange = (newScore) => {
      setScore(newScore);
      if (newScore > 0 && audioManagerRef.current) {
        audioManagerRef.current.playScoreSound();
      }
    };

    engine.onGameOver = (finalScore, levelId) => {
      setGameState('GAME_OVER');
      if (audioManagerRef.current) {
        audioManagerRef.current.pauseMusic();
        audioManagerRef.current.playHitSound();
        audioManagerRef.current.playGameOverSound();
      }

      // Record high scores
      setProgress((prev) => {
        const prevLevelBest = prev.levelHighScores[levelId] || 0;
        const newLevelBest = Math.max(prevLevelBest, finalScore);
        const newOverallBest = Math.max(prev.overallBestScore, finalScore);

        const updated: PlayerProgress = {
          ...prev,
          levelHighScores: {
            ...prev.levelHighScores,
            [levelId]: newLevelBest,
          },
          overallBestScore: newOverallBest,
        };
        StorageService.saveProgress(updated);
        return updated;
      });
    };

    engine.onLevelComplete = (levelId, finalScore) => {
      setGameState('LEVEL_COMPLETE');
      if (audioManagerRef.current) {
        audioManagerRef.current.playLevelCompleteSound();
      }

      // Unlock next level & save high scores
      setProgress((prev) => {
        const nextLevelId = Math.min(levelId + 1, 10);
        const unlocked = Math.max(prev.unlockedLevel, nextLevelId);
        const prevLevelBest = prev.levelHighScores[levelId] || 0;
        const completed = prev.completedLevels.includes(levelId)
          ? prev.completedLevels
          : [...prev.completedLevels, levelId];

        const updated: PlayerProgress = {
          ...prev,
          unlockedLevel: unlocked,
          levelHighScores: {
            ...prev.levelHighScores,
            [levelId]: Math.max(prevLevelBest, finalScore),
          },
          overallBestScore: Math.max(prev.overallBestScore, finalScore),
          completedLevels: completed,
        };
        StorageService.saveProgress(updated);
        return updated;
      });
    };

    engine.onVictory = (finalScore) => {
      setGameState('VICTORY');
      if (audioManagerRef.current) {
        audioManagerRef.current.playLevelCompleteSound();
      }

      setProgress((prev) => {
        const updated: PlayerProgress = {
          ...prev,
          unlockedLevel: 10,
          overallBestScore: Math.max(prev.overallBestScore, finalScore),
        };
        StorageService.saveProgress(updated);
        return updated;
      });
    };

    engine.startLoop();

    return () => {
      engine.stopLoop();
    };
  }, []); // Run once on mount

  // Update level when currentLevel changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLevel(currentLevel);
    }
  }, [currentLevel]);

  // Global user gesture audio unlock listener for mobile and desktop autoplay policy
  useEffect(() => {
    const handleUserGesture = () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.unlockAudio();
      }
    };

    window.addEventListener('pointerdown', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleUserGesture, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserGesture, { capture: true });
      window.removeEventListener('touchstart', handleUserGesture, { capture: true });
      window.removeEventListener('keydown', handleUserGesture, { capture: true });
    };
  }, []);

  // Handle User Input (Flap / Jump)
  const handleJump = useCallback(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.unlockAudio();
    }

    if (!engineRef.current) return;

    // Any open modal intercepts clicks
    if (isLevelSelectOpen || isCustomizerOpen || isSettingsOpen || isInstructionsOpen) {
      return;
    }

    if (gameState === 'MENU') {
      handleStartGame();
      return;
    }

    if (gameState === 'PLAYING') {
      engineRef.current.triggerJump();
    }
  }, [gameState, isLevelSelectOpen, isCustomizerOpen, isSettingsOpen, isInstructionsOpen]);

  // Global Keyboard Controls (Space, ArrowUp, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space or ArrowUp to flap
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          handlePauseGame();
        } else if (gameState === 'PAUSED') {
          handleResumeGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, gameState]);

  // Game Control Actions
  const handleStartGame = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.unlockAudio();
    }
    if (!engineRef.current) return;
    setGameState('PLAYING');
    setScore(0);
    engineRef.current.startLevel(currentLevel);

    if (audioManagerRef.current) {
      audioManagerRef.current.startMusic(currentLevel.musicTheme);
    }
  };

  const handlePauseGame = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setGameState('PAUSED');
    if (audioManagerRef.current) {
      audioManagerRef.current.pauseMusic();
    }
  };

  const handleResumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setGameState('PLAYING');
    if (audioManagerRef.current) {
      audioManagerRef.current.resumeMusic();
    }
  };

  const handleRestartLevel = () => {
    if (!engineRef.current) return;
    setScore(0);
    setGameState('PLAYING');
    engineRef.current.startLevel(currentLevel);
    if (audioManagerRef.current) {
      audioManagerRef.current.startMusic(currentLevel.musicTheme);
    }
  };

  const handleReturnToMenu = () => {
    if (!engineRef.current) return;
    setGameState('MENU');
    engineRef.current.resetToMenu();
    if (audioManagerRef.current) {
      audioManagerRef.current.pauseMusic();
    }
  };

  const handleContinueToNextLevel = () => {
    const nextIdx = currentLevel.id; // next level index (0-indexed = currentLevel.id)
    if (nextIdx < LEVELS.length) {
      const nextLvl = LEVELS[nextIdx];
      setCurrentLevel(nextLvl);
      setGameState('PLAYING');
      setScore(0);
      if (engineRef.current) {
        engineRef.current.startLevel(nextLvl);
      }
      if (audioManagerRef.current) {
        audioManagerRef.current.startMusic(nextLvl.musicTheme);
      }
    } else {
      handleReturnToMenu();
    }
  };

  const handleSelectLevel = (selected: LevelConfig) => {
    setCurrentLevel(selected);
    setGameState('PLAYING');
    setScore(0);
    if (engineRef.current) {
      engineRef.current.startLevel(selected);
    }
    if (audioManagerRef.current) {
      audioManagerRef.current.startMusic(selected.musicTheme);
    }
  };

  // Character Handlers
  const handleSaveCharacter = async (char: CustomCharacter) => {
    setCustomCharacter(char);
    await StorageService.saveCustomCharacter(char);
    if (engineRef.current) {
      engineRef.current.setCustomCharacter(char.dataUrl);
    }
  };

  const handleRestoreDefaultCharacter = async () => {
    setCustomCharacter(null);
    await StorageService.clearCustomCharacter();
    if (engineRef.current) {
      engineRef.current.setCustomCharacter(null);
    }
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleResetProgress = () => {
    const fresh = StorageService.resetProgress();
    setProgress(fresh);
    setCurrentLevel(LEVELS[0]);
    if (engineRef.current) {
      engineRef.current.setLevel(LEVELS[0]);
      engineRef.current.resetToMenu();
    }
    setGameState('MENU');
  };

  const nextLevel = currentLevel.id < LEVELS.length ? LEVELS[currentLevel.id] : null;
  const currentBestScore = progress.levelHighScores[currentLevel.id] || 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#070b14] overflow-hidden select-none font-sans-clean">
      
      {/* Arcade Cabinet Frame Container */}
      <div className="relative w-full h-full max-w-[500px] max-h-[860px] flex flex-col items-center justify-center bg-black sm:rounded-3xl sm:border-4 sm:border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* HTML5 Game Canvas Viewport */}
        <div
          className="relative w-full h-full cursor-pointer touch-none"
          onClick={handleJump}
          onTouchStart={(e) => {
            // Prevent scrolling or delayed zoom
            e.preventDefault();
            handleJump();
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block pixelated"
          />

          {/* Low-Occlusion In-Game HUD */}
          {gameState === 'PLAYING' && (
            <HudOverlay
              score={score}
              bestScore={currentBestScore}
              level={currentLevel}
              settings={settings}
              onPause={handlePauseGame}
              voiceTriggerCount={voiceTriggerCount}
            />
          )}

          {/* Title Screen Overlay */}
          {gameState === 'MENU' && (
            <TitleMenu
              onStartGame={handleStartGame}
              onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenInstructions={() => setIsInstructionsOpen(true)}
              progress={progress}
              settings={settings}
              character={customCharacter}
            />
          )}
        </div>

        {/* CRT Scanline Filter effect (optional subtle retro texture) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />

      </div>

      {/* Modals & Menus */}
      <PauseModal
        isOpen={gameState === 'PAUSED'}
        onResume={handleResumeGame}
        onRestart={handleRestartLevel}
        onMainMenu={handleReturnToMenu}
        settings={settings}
        onToggleMusic={() => handleUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
        onToggleVoice={() => handleUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
      />

      <GameOverModal
        isOpen={gameState === 'GAME_OVER'}
        score={score}
        bestScore={currentBestScore}
        level={currentLevel}
        onRetry={handleRestartLevel}
        onMainMenu={handleReturnToMenu}
      />

      <LevelCompleteModal
        isOpen={gameState === 'LEVEL_COMPLETE'}
        score={score}
        level={currentLevel}
        nextLevel={nextLevel}
        onContinue={handleContinueToNextLevel}
        onReplay={handleRestartLevel}
        onMainMenu={handleReturnToMenu}
      />

      <VictoryModal
        isOpen={gameState === 'VICTORY'}
        score={score}
        progress={progress}
        onReplay={handleRestartLevel}
        onMainMenu={handleReturnToMenu}
      />

      <LevelSelectModal
        isOpen={isLevelSelectOpen}
        onClose={() => setIsLevelSelectOpen(false)}
        progress={progress}
        onSelectLevel={handleSelectLevel}
        currentSelectedLevelId={currentLevel.id}
      />

      <CharacterCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentCharacter={customCharacter}
        onSaveCharacter={handleSaveCharacter}
        onRestoreDefault={handleRestoreDefaultCharacter}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetProgress={handleResetProgress}
        onOpenCustomizer={() => {
          setIsSettingsOpen(false);
          setIsCustomizerOpen(true);
        }}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

    </div>
  );
}
