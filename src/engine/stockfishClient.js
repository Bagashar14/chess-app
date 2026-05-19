let worker = null;
let ready = false;
let initPromise = null;
let pendingResolve = null;

function getBase() {
  const base = process.env.PUBLIC_URL || "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function handleMessage(line) {
  if (line === "uciok") ready = true;
  if (line.startsWith("bestmove ") && pendingResolve) {
    const parts = line.split(" ");
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve(parts[1] === "(none)" ? null : parts[1]);
  }
}

export function initStockfish() {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    try {
      const base = getBase();
      const wasmPath = `${base}/stockfish/stockfish-18-lite-single.wasm`;
      const jsPath = `${base}/stockfish/stockfish-18-lite-single.js`;
      worker = new Worker(`${jsPath}#${wasmPath},worker`);

      worker.onmessage = (e) => handleMessage(String(e.data).trim());
      worker.onerror = (err) => reject(err);

      const check = setInterval(() => {
        if (ready) {
          clearInterval(check);
          resolve();
        }
      }, 50);

      worker.postMessage("uci");

      setTimeout(() => {
        if (!ready) {
          clearInterval(check);
          reject(new Error("Stockfish timeout"));
        }
      }, 30000);
    } catch (err) {
      reject(err);
    }
  });

  return initPromise;
}

export function getBestMove(fen, depth = 8) {
  return new Promise((resolve, reject) => {
    if (!worker || !ready) {
      reject(new Error("Stockfish not ready"));
      return;
    }

    const timeout = setTimeout(() => {
      pendingResolve = null;
      reject(new Error("Stockfish move timeout"));
    }, 15000);

    pendingResolve = (move) => {
      clearTimeout(timeout);
      resolve(move);
    };

    worker.postMessage("ucinewgame");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${Math.min(15, Math.max(1, depth))}`);
  });
}

export function terminateStockfish() {
  if (worker) {
    worker.postMessage("quit");
    worker.terminate();
    worker = null;
  }
  ready = false;
  initPromise = null;
}
