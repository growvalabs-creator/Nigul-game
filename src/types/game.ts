/**
 * Core type definitions for Nigul Bird game.
 */

export type GameState = 
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'VICTORY';

export interface LevelTheme {
  skyGradient: [string, string];
  sunColor?: string;
  sunPosition?: { x: number; y: number; r: number };
  stars?: boolean;
  retroGrid?: boolean;
  pipeColor: string;
  pipeLipColor: string;
  pipeHighlight: string;
  groundColor: string;
  groundTrimColor: string;
  groundStripeColor: string;
  cloudColor: string;
  cloudAlpha: number;
  ambientParticleColor?: string;
  name: string;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  theme: LevelTheme;
  pipeGap: number;        // Gap between top & bottom pipes
  pipeSpeed: number;      // Horizontal speed in px/sec
  pipeInterval: number;   // Spawn interval distance in px
  targetScore: number;    // Pipes to pass to clear level
  gravity: number;        // Downward gravity in px/sec^2
  jumpForce: number;      // Upward flap impulse in px/sec
  musicTheme: 'classic' | 'retro' | 'synthwave' | 'intense' | 'boss';
  description: string;
}

export interface GameSettings {
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  voiceEnabled: boolean;
  voiceVolume: number;
  voiceMode: 'recording' | 'procedural' | 'speech';
  highContrast: boolean;
  crtEffect: boolean;
}

export interface PlayerProgress {
  unlockedLevel: number;
  levelHighScores: Record<number, number>;
  overallBestScore: number;
  totalJumps: number;
  totalNigulCount: number;
  completedLevels: number[];
}

export interface CustomCharacter {
  id: string;
  name: string;
  dataUrl: string | null;  // null = default procedural Nigul Bird
  isDefault: boolean;
  timestamp: number;
}
