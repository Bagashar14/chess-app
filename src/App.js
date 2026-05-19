import { useState, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./App.css";

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [status, setStatus] = useState("Ваш ход (белые)");
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [difficulty, setDifficulty] = useState("Medium");
  const [gameOver, setGameOver] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [coachMessage, setCoachMessage] = useState("");
  const [loadingCoach, setLoadingCoach] = useState(false);
  const thinkingRef = useRef(false);

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      setStatus(g.turn() === "w" ? "Чёрные победили! Мат!" : "Вы победили! Мат!");
      setGameOver(true);
    } else if (g.isDraw()) {
      setStatus("Ничья!");
      setGameOver(true);
    } else if (g.isCheck()) {
      setStatus(g.turn() === "w" ? "Шах! Ваш ход" : "Шах! Ход ИИ");
    } else {
      setStatus(g.turn() === "w" ? "Ваш ход (белые)" : "ИИ думает...");
    }
  }, []);

  const makeAIMove = useCallback((g) => {
    if (g.isGameOver()) return;
    thinkingRef.current = true;
    setThinking(true);
    setTimeout(() => {
      const moves = g.moves();
      if (moves.length === 0) { thinkingRef.current = false; setThinking(false); return; }
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const newGame = new Chess(g.fen());
      newGame.move(randomMove);
      setGame(newGame);
      setFen(newGame.fen());
      setHistory(newGame.history({ verbose: true }));
      updateStatus(newGame);
      thinkingRef.current = false;
      setThinking(false);
    }, 500);
  }, [updateStatus]);

  function onDrop(sourceSquare, targetSquare) {
    if (gameOver || thinkingRef.current) return false;
    if (game.turn() !== "w") return false;
    const newGame = new Chess(game.fen());
    const move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!move) return false;
    setGame(newGame);
    setFen(newGame.fen());
    setHistory(newGame.history({ verbose: true }));
    updateStatus(newGame);
    if (!newGame.isGameOver()) {
      setTimeout(() => makeAIMove(newGame), 300);
    }
    return true;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen("start");
    setHistory([]);
    setStatus("Ваш ход (белые)");
    setGameOver(false);
    setCoachMessage("");
    thinkingRef.current = false;
    setThinking(false);
  }

  async function getCoachAnalysis() {
    if (history.length < 2) { setCoachMessage("Сыграйте несколько ходов!"); return; }
    setLoadingCoach(true);
    setCoachMessage("");
    const moves = history.map((m, i) => `${i + 1}. ${m.san}`).join(" ");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `Ты шахматный тренер. Проанализируй эту партию и дай короткий совет на русском языке (3-4 предложения). Укажи одну главную ошибку и один хороший ход. Ходы: ${moves}` }],
        }),
      });
      const data = await response.json();
      setCoachMessage(data.content[0].text);
    } catch { setCoachMessage("Ошибка при получении анализа."); }
    setLoadingCoach(false);
  }

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#0f0f1a" : "#f0f0f0", color: isDark ? "#fff" : "#111", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <span style={{ fontSize: 36 }}>♟</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>ChessMaster AI</h1>
        <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ background: isDark ? "#2a2a3d" : "#ddd", border: "none", borderRadius: 8, padding: "6px 14px", color: isDark ? "#fff" : "#111", cursor: "pointer", fontSize: 18 }}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <div>
          <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={420} customDarkSquareStyle={{ backgroundColor: isDark ? "#4a4a8a" : "#769656" }} customLightSquareStyle={{ backgroundColor: isDark ? "#9090c0" : "#eeeed2" }} />
          <div style={{ marginTop: 12, padding: "10px 16px", background: isDark ? "#1e1e2e" : "#fff", borderRadius: 10, textAlign: "center", fontWeight: 600, fontSize: 16, border: `2px solid ${gameOver ? "#f59e0b" : isDark ? "#3a3a5c" : "#ccc"}` }}>
            {thinking ? "⏳ ИИ думает..." : status}
          </div>
        </div>

        <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: isDark ? "#1e1e2e" : "#fff", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>🎯 Сложность</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Easy", "Medium", "Hard"].map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", background: difficulty === d ? "#6c63ff" : isDark ? "#2a2a3d" : "#eee", color: difficulty === d ? "#fff" : isDark ? "#aaa" : "#555", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  {d === "Easy" ? "Лёгкий" : d === "Medium" ? "Средний" : "Сложный"}
                </button>
              ))}
            </div>
          </div>

          <button onClick={resetGame} style={{ padding: "12px", borderRadius: 10, border: "none", background: "#6c63ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            🔄 Новая игра
          </button>

          <div style={{ background: isDark ? "#1e1e2e" : "#fff", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>🧠 AI Тренер</div>
            <button onClick={getCoachAnalysis} disabled={loadingCoach} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: loadingCoach ? "#555" : "#10b981", color: "#fff", fontWeight: 700, cursor: loadingCoach ? "not-allowed" : "pointer", fontSize: 14 }}>
              {loadingCoach ? "Анализирую..." : "Анализировать партию"}
            </button>
            {coachMessage && <div style={{ marginTop: 12, padding: 12, background: isDark ? "#0f2d1f" : "#ecfdf5", borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: isDark ? "#6ee7b7" : "#065f46" }}>{coachMessage}</div>}
          </div>

          <div style={{ background: isDark ? "#1e1e2e" : "#fff", borderRadius: 12, padding: 16, maxHeight: 200, overflowY: "auto" }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>📜 История ходов</div>
            {history.length === 0 ? <div style={{ color: "#888", fontSize: 13 }}>Ходов пока нет</div> : (
              <div style={{ fontSize: 13, lineHeight: 2 }}>
                {history.reduce((acc, move, i) => {
                  if (i % 2 === 0) acc.push(<div key={i} style={{ display: "flex", gap: 8 }}><span style={{ color: "#888", minWidth: 24 }}>{Math.floor(i / 2) + 1}.</span><span>{move.san}</span>{history[i + 1] && <span style={{ color: "#aaa" }}>{history[i + 1].san}</span>}</div>);
                  return acc;
                }, [])}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}