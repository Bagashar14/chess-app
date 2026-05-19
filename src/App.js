import { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { useChessGame } from "./hooks/useChessGame";
import { getDepthForDifficulty } from "./engine/aiPlayer";
import "./App.css";

const PROMO_PIECES = [
  { piece: "q", label: "♕ Ферзь" },
  { piece: "r", label: "♖ Ладья" },
  { piece: "b", label: "♗ Слон" },
  { piece: "n", label: "♘ Конь" },
];

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [difficulty, setDifficulty] = useState("Medium");
  const [boardWidth, setBoardWidth] = useState(420);
  const isDark = theme === "dark";

  const {
    fen,
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
  } = useChessGame(difficulty);

  useEffect(() => {
    const update = () => setBoardWidth(Math.min(420, window.innerWidth - 40));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const boardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop: onDrop,
      boardStyle: { width: boardWidth, maxWidth: "100%" },
      darkSquareStyle: { backgroundColor: isDark ? "#4a4a8a" : "#769656" },
      lightSquareStyle: { backgroundColor: isDark ? "#9090c0" : "#eeeed2" },
    }),
    [fen, isDark, onDrop, boardWidth]
  );

  const panel = { background: isDark ? "#1e1e2e" : "#fff", borderRadius: 12, padding: 16 };
  const depth = getDepthForDifficulty(difficulty);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#0f0f1a" : "#f0f0f0",
        color: isDark ? "#fff" : "#111",
        fontFamily: "'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: 32 }}>♟</span>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>ChessMaster AI</h1>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            background: isDark ? "#2a2a3d" : "#ddd",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            color: isDark ? "#fff" : "#111",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 900 }}>
        <div style={{ position: "relative" }}>
          <Chessboard options={boardOptions} />
          {pendingPromotion && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                gap: 10,
                zIndex: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>Выберите фигуру</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {PROMO_PIECES.map(({ piece, label }) => (
                  <button
                    key={piece}
                    type="button"
                    onClick={() => completePromotion(piece)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#6c63ff",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={cancelPromotion} style={{ background: "transparent", border: "none", color: "#aaa", cursor: "pointer", fontSize: 12 }}>
                Отмена
              </button>
            </div>
          )}
          <div
            style={{
              marginTop: 12,
              padding: "10px 16px",
              background: isDark ? "#1e1e2e" : "#fff",
              borderRadius: 10,
              textAlign: "center",
              fontWeight: 600,
              fontSize: 15,
              border: `2px solid ${gameOver ? "#f59e0b" : isDark ? "#3a3a5c" : "#ccc"}`,
            }}
          >
            {thinking ? "⏳ Компьютер думает..." : status}
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={panel}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>🎯 Сложность (Stockfish)</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Easy", "Medium", "Hard"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    borderRadius: 8,
                    border: "none",
                    background: difficulty === d ? "#6c63ff" : isDark ? "#2a2a3d" : "#eee",
                    color: difficulty === d ? "#fff" : isDark ? "#aaa" : "#555",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {d === "Easy" ? "Лёгкий" : d === "Medium" ? "Средний" : "Сложный"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>Глубина анализа: {depth}</div>
          </div>

          <button
            type="button"
            onClick={resetGame}
            style={{ padding: 12, borderRadius: 10, border: "none", background: "#6c63ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            🔄 Новая игра
          </button>

          <div style={panel}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>📜 Ходы партии</div>
            {history.length === 0 ? (
              <div style={{ color: "#888", fontSize: 13 }}>Ходов пока нет</div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 2, maxHeight: 140, overflowY: "auto" }}>
                {history.reduce((acc, move, i) => {
                  if (i % 2 === 0) {
                    acc.push(
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: "#888", minWidth: 24 }}>{Math.floor(i / 2) + 1}.</span>
                        <span>{move.san}</span>
                        {history[i + 1] && <span style={{ color: "#aaa" }}>{history[i + 1].san}</span>}
                      </div>
                    );
                  }
                  return acc;
                }, [])}
              </div>
            )}
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>💾 История игр</div>
            {savedGames.length === 0 ? (
              <div style={{ color: "#888", fontSize: 13 }}>Завершите партию — она сохранится</div>
            ) : (
              <div style={{ fontSize: 12, maxHeight: 160, overflowY: "auto" }}>
                {savedGames.slice(0, 10).map((g) => (
                  <div key={g.id} style={{ padding: "6px 0", borderBottom: `1px solid ${isDark ? "#333" : "#eee"}` }}>
                    <div style={{ color: "#888" }}>{new Date(g.date).toLocaleString("ru-RU")}</div>
                    <div>
                      {g.result === "white"
                        ? "Победа белых"
                        : g.result === "black"
                          ? "Победа чёрных"
                          : g.result === "draw"
                            ? "Ничья"
                            : "—"}{" "}
                      · {g.moves} ходов
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
