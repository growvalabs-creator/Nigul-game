/**
 * Storage manager for Nigul Bird.
 * Uses LocalStorage for settings and progress metrics.
 * Uses IndexedDB for large custom character images to avoid 5MB quota errors.
 */

import { GameSettings, PlayerProgress, CustomCharacter } from '../types/game';

const SETTINGS_KEY = 'nigul_bird_settings_v1';
const PROGRESS_KEY = 'nigul_bird_progress_v1';
const DB_NAME = 'NigulBirdDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_character';

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  musicVolume: 0.65,
  sfxEnabled: true,
  sfxVolume: 0.75,
  voiceEnabled: true,
  voiceVolume: 0.9,
  voiceMode: 'recording', // Real authentic voice recording uploaded by user
  highContrast: false,
  crtEffect: false,
};

export const DEFAULT_PROGRESS: PlayerProgress = {
  unlockedLevel: 1,
  levelHighScores: {},
  overallBestScore: 0,
  totalJumps: 0,
  totalNigulCount: 0,
  completedLevels: [],
};

export class StorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  // --- Settings Persistence ---
  static loadSettings(): GameSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for settings, using defaults', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to LocalStorage', e);
    }
  }

  // --- Progress Persistence ---
  static loadProgress(): PlayerProgress {
    try {
      const data = localStorage.getItem(PROGRESS_KEY);
      if (data) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for progress, using defaults', e);
    }
    return { ...DEFAULT_PROGRESS };
  }

  static saveProgress(progress: PlayerProgress): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to LocalStorage', e);
    }
  }

  static resetProgress(): PlayerProgress {
    const fresh = { ...DEFAULT_PROGRESS };
    this.saveProgress(fresh);
    return fresh;
  }

  // --- IndexedDB for Custom Character ---
  private static getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          return reject(new Error('IndexedDB not supported in this browser'));
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  static async saveCustomCharacter(character: CustomCharacter): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(character);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB write failed, falling back to LocalStorage', err);
      // Fallback
      try {
        localStorage.setItem('nigul_bird_char_backup', JSON.stringify(character));
      } catch (e) {
        console.error('LocalStorage backup also failed', e);
      }
    }
  }

  static async loadCustomCharacter(): Promise<CustomCharacter | null> {
    try {
      const db = await this.getDB();
      return await new Promise<CustomCharacter | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('active_character');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('IndexedDB read failed, attempting LocalStorage fallback', err);
      try {
        const fallback = localStorage.getItem('nigul_bird_char_backup');
        if (fallback) return JSON.parse(fallback);
      } catch (e) {
        // ignore
      }
      return null;
    }
  }

  static async clearCustomCharacter(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete('active_character');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
      localStorage.removeItem('nigul_bird_char_backup');
    } catch (e) {
      localStorage.removeItem('nigul_bird_char_backup');
    }
  }
}
