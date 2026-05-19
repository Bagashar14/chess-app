# ChessMaster AI — План MVP (Уровень 3)

## Текущий статус (демо для отбора)

| Функция | Статус |
|---------|--------|
| chess.js — валидация ходов | ✅ Реализовано |
| Игра против ИИ (Stockfish) | ✅ Реализовано (глубина 1–15) |
| Рокировка / en passant / превращение | ✅ через chess.js |
| История ходов в сессии | ✅ |
| Сохранение партий | ✅ localStorage (демо) |
| Тёмная / светлая тема | ✅ |
| Звуки ходов | ✅ |
| Tailwind + Supabase + Google Auth | 📋 Фаза 2 (после одобрения) |

---

## Архитектура (Hexagonal / DDD)

```
┌─────────────────────────────────────────────────────────┐
│                    UI (React)                            │
│  App.js, Chessboard, панели, тема, звуки                │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Application (hooks)                         │
│  useChessGame — оркестрация ходов, ИИ, сохранение       │
└──────────────┬──────────────────────────┬─────────────────┘
               │                          │
┌──────────────▼──────────────┐  ┌────────▼────────────────┐
│   Domain: chessGame.js      │  │  Port: gameStorage.js   │
│   Chess.js, FEN, PGN,       │  │  localStorage → Supabase│
│   game.move() validation    │  │  (Фаза 2)               │
└──────────────┬──────────────┘  └─────────────────────────┘
               │
┌──────────────▼──────────────┐
│   Engine: stockfishClient   │
│   UCI, depth 1–15           │
└─────────────────────────────┘
```

**Принцип:** React не знает правил шахмат — только вызывает `chessGame.makeMove()`. Нелегальный ход → `null` → фигура возвращается (`onPieceDrop` → `false`).

---

## Структура проекта (целевая)

```
chess-app/
├── public/
│   └── stockfish/          # WASM движок (копируется при postinstall)
├── src/
│   ├── domain/
│   │   └── chessGame.js
│   ├── engine/
│   │   ├── stockfishClient.js
│   │   └── aiPlayer.js
│   ├── storage/
│   │   └── gameStorage.js
│   ├── hooks/
│   │   └── useChessGame.js
│   ├── utils/
│   │   └── sounds.js
│   └── App.js
├── vibe_docs/
│   └── plan.md
├── scripts/
│   └── copy-stockfish.js
├── .env.example
└── vercel.json
```

---

## Фаза 2 (после одобрения плана)

### Supabase

**Таблица `games`:**
```sql
create table games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  pgn text not null,
  result text check (result in ('white','black','draw','ongoing')),
  created_at timestamptz default now()
);
```

**RLS:** пользователь видит только свои партии.

### Tailwind CSS

- Перенос стилей из inline → utility-классы
- Breakpoints: `sm`, `md`, `lg` для доски и боковой панели

### Google Login

- `@supabase/supabase-js` + `signInWithOAuth({ provider: 'google' })`

---

## Переменные окружения (`.env.local`)

Скопируйте `.env.example` → `.env.local`:

```env
# Supabase (Фаза 2)
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key

# Опционально: AI-тренер (не хранить секреты в клиенте на проде!)
# REACT_APP_COACH_API_URL=https://your-backend/api/coach
```

> **Важно:** `SERVICE_ROLE` ключ Supabase и API-ключи LLM **никогда** не добавлять в React. Только на backend / Edge Functions.

---

## Деплой (Vercel)

1. Push в GitHub: `https://github.com/Bagashar14/chess-app`
2. [vercel.com](https://vercel.com) → Import Project → выбрать репозиторий
3. Build: `npm run build`, Output: `build`
4. Deploy → получить URL для отбора

`vercel.json` уже настроен для SPA-роутинга.

---

## Сложность Stockfish

| UI | Depth UCI |
|----|-----------|
| Лёгкий | 3 |
| Средний | 8 |
| Сложный | 15 |

Слайдер глубины 1–15 — в расширенной версии.
