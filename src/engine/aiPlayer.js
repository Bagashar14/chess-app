import { Chess } from "chess.js";
import { initStockfish, getBestMove } from "./stockfishClient";

const DEPTH_MAP = { Easy: 3, Medium: 8, Hard: 15 };

let engineReady = false;
let engineFailed = false;

export async function ensureEngine() {
  if (engineReady || engineFailed) return engineReady;
  try {
    await initStockfish();
    engineReady = true;
  } catch {
    engineFailed = true;
  }
  return engineReady;
}

function randomMove(fen) {
  const g = new Chess(fen);
  const moves = g.moves({ verbose: true });
  if (!moves.length) return null;
  const m = moves[Math.floor(Math.random() * moves.length)];
  return m.from + m.to + (m.promotion || "");
}

export function getDepthForDifficulty(difficulty) {
  return DEPTH_MAP[difficulty] ?? 8;
}

export async function pickAIMove(fen, difficulty) {
  const depth = getDepthForDifficulty(difficulty);
  const ready = await ensureEngine();

  if (ready) {
    try {
      const uci = await getBestMove(fen, depth);
      if (uci) return uci;
    } catch {
      /* fallback */
    }
  }

  return randomMove(fen);
}
