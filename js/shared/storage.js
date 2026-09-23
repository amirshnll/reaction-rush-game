import { storage } from './browser-api.js';

export const DEFAULT_STATS = { highScore: 0, fastestReaction: null, totalReactionMs: 0, successfulClicks: 0, gamesPlayed: 0 };
export async function loadProfile() {
  const data = await storage.get(['stats', 'language', 'sound']);
  return { stats: { ...DEFAULT_STATS, ...(data.stats || {}) }, language: data.language || navigator.language, sound: data.sound ?? true };
}
export async function saveProfile(profile) { await storage.set(profile); }
export async function resetStats() { await storage.set({ stats: DEFAULT_STATS }); return { ...DEFAULT_STATS }; }
