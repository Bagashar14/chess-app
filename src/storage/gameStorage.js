const KEY = "chessmaster_saved_games";

export function loadSavedGames() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGame(record) {
  const games = loadSavedGames();
  games.unshift({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    ...record,
  });
  localStorage.setItem(KEY, JSON.stringify(games.slice(0, 50)));
  return games;
}
