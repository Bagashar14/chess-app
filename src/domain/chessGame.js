import { Chess } from "chess.js";

export function createGame(fen) {
  return fen ? new Chess(fen) : new Chess();
}

export function cloneGame(game) {
  return new Chess(game.fen());
}

export function tryMove(game, from, to, promotion = "q") {
  const next = cloneGame(game);
  const move = next.move({ from, to, promotion });
  if (!move) return null;
  return { game: next, move };
}

export function needsPromotion(game, from, to) {
  const piece = game.get(from);
  if (!piece || piece.type !== "p") return false;
  const rank = to[1];
  return (piece.color === "w" && rank === "8") || (piece.color === "b" && rank === "1");
}

export function getStatusMessage(game) {
  if (game.isCheckmate()) {
    return game.turn() === "w"
      ? "Чёрные победили! Мат!"
      : "Вы победили! Мат!";
  }
  if (game.isDraw()) return "Ничья!";
  if (game.isCheck()) {
    return game.turn() === "w" ? "Шах! Ваш ход" : "Шах! Ход компьютера";
  }
  return game.turn() === "w" ? "Ваш ход (белые)" : "Компьютер думает...";
}

export function getResult(game) {
  if (!game.isGameOver()) return "ongoing";
  if (game.isCheckmate()) return game.turn() === "w" ? "black" : "white";
  return "draw";
}

export function toPgn(game) {
  return game.pgn();
}

export function getVerboseHistory(game) {
  return game.history({ verbose: true });
}
