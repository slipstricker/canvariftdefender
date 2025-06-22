import { LeaderboardEntry } from './types';
import { LEADERBOARD_KEY, ADMIN_LEADERBOARD_KEY, MAX_LEADERBOARD_ENTRIES } from './constants';

const DELAY = 200; // Simulate network delay

export const fetchLeaderboard = async (isAdminLeaderboard: boolean): Promise<LeaderboardEntry[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const key = isAdminLeaderboard ? ADMIN_LEADERBOARD_KEY : LEADERBOARD_KEY;
        const storedScores = localStorage.getItem(key);
        if (storedScores) {
          resolve(JSON.parse(storedScores) as LeaderboardEntry[]);
        } else {
          resolve([]);
        }
      } catch (error) {
        console.error("Simulated API Error - Failed to fetch leaderboard:", error);
        reject(error);
      }
    }, DELAY);
  });
};

export const submitScore = async (newEntry: LeaderboardEntry, isAdminPlayer: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const keyToUse = isAdminPlayer ? ADMIN_LEADERBOARD_KEY : LEADERBOARD_KEY;
        const currentScoresForType = localStorage.getItem(keyToUse);
        const existingEntries: LeaderboardEntry[] = currentScoresForType ? JSON.parse(currentScoresForType) : [];

        const updatedLeaderboard = [...existingEntries, newEntry]
          .sort((a, b) => {
            if (b.wave !== a.wave) {
              return b.wave - a.wave; // Higher wave is better
            }
            // If waves are the same, higher time is better (descending order of time)
            return b.time - a.time; 
          })
          .slice(0, MAX_LEADERBOARD_ENTRIES);

        localStorage.setItem(keyToUse, JSON.stringify(updatedLeaderboard));
        resolve();
      } catch (error) {
        console.error("Simulated API Error - Failed to submit score:", error);
        reject(error);
      }
    }, DELAY);
  });
};