import { useState, useCallback, useRef, useEffect } from "react";
import {
  createGame,
  tryMove,
  needsPromotion,
  getStatusMessage,
  getResult,
  toPgn,
  getVerboseHistory,
} from "../domain/chessGame";
import { pickAIMove } from "../engine/aiPlayer";
import { loadSavedGames, saveGame } from "../storage/gameStorage";
import { playMoveSound, playCaptureSound, playCheckSound, playGameEndSound } from "../utils/sounds";

export function useChessGame(difficulty) {
  const [game, setGame] = useState(() => createGame());
  const [status, setStatus] = useState("Ваш ход (белые)");
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [savedGames, setSavedGames] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  const thinkingRef = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    setSavedGames(loadSavedGames());
  }, []);

  const applyMoveFeedback = useCallback((move, nextGame) => {
    if (move.captured) playCaptureSound();
    else playMoveSound();
    if (nextGame.isCheck()) playCheckSound();
    if (nextGame.isGameOver()) playGameEndSound();
  }, []);

  const finishGameState = useCallback((nextGame) => {
    setGame(nextGame);
    setHistory(getVerboseHistory(nextGame));
    const over = nextGame.isGameOver();
    setGameOver(over);
    setStatus(getStatusMessage(nextGame));
    if (over) {
      const updated = saveGame({
        pgn: toPgn(nextGame),
        result: getResult(nextGame),
        moves: getVerboseHistory(nextGame).length,
      });
      setSavedGames(updated);
    }
    return nextGame;
  }, []);

  const runAIMove = useCallback(
    async (currentGame) => {
      if (currentGame.isGameOver() || currentGame.turn() !== "b") return;

      thinkingRef.current = true;
      setThinking(true);

      await new Promise((r) => setTimeout(r, 500));

      try {
        const uci = await pickAIMove(currentGame.fen(), difficulty);
        if (!uci) return;

        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length > 4 ? uci[4] : "q";
        const result = tryMove(currentGame, from, to, promotion);
        if (!result) return;

        applyMoveFeedback(result.move, result.game);
        finishGameState(result.game);
      } finally {
        thinkingRef.current = false;
        setThinking(false);
      }
    },
    [difficulty, applyMoveFeedback, finishGameState]
  );

  const completePromotion = useCallback(
    (piece) => {
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);
      const result = tryMove(gameRef.current, from, to, piece);
      if (!result) return false;

      applyMoveFeedback(result.move, result.game);
      const next = finishGameState(result.game);
      if (!next.isGameOver()) runAIMove(next);
      return true;
    },
    [pendingPromotion, applyMoveFeedback, finishGameState, runAIMove]
  );

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (gameOver || thinkingRef.current || !targetSquare) return false;
      if (gameRef.current.turn() !== "w") return false;

      if (needsPromotion(gameRef.current, sourceSquare, targetSquare)) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return false;
      }

      const result = tryMove(gameRef.current, sourceSquare, targetSquare);
      if (!result) return false;

      applyMoveFeedback(result.move, result.game);
      const next = finishGameState(result.game);
      if (!next.isGameOver()) runAIMove(next);
      return true;
    },
    [gameOver, applyMoveFeedback, finishGameState, runAIMove]
  );

  const resetGame = useCallback(() => {
    const fresh = createGame();
    setGame(fresh);
    setHistory([]);
    setStatus("Ваш ход (белые)");
    setGameOver(false);
    setPendingPromotion(null);
    thinkingRef.current = false;
    setThinking(false);
  }, []);

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  return {
    game,
    fen: game.fen(),
    status,
    history,
    gameOver,
    thinking,
    savedGames,
    pendingPromotion,
    onDrop,
    resetGame,
    completePromotion,
    cancelPromotion,
  };
}
