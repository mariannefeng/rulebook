import type { Game } from "./types";

const STORAGE_KEY = "rulebook";

export const setRecentGames = (games: Game[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
};

export const getRecentGames = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const recentGames = data ? JSON.parse(data) : [];
  return recentGames;
};
