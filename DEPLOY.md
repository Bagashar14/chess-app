# Как выложить игру в интернет (для отбора)

## Шаг 1 — Залить код на GitHub

1. Откройте [github.com/Bagashar14/chess-app](https://github.com/Bagashar14/chess-app)
2. В Cursor: **Source Control** (иконка ветки слева) → напишите сообщение → **Commit** → **Sync/Push**

Или в терминале:

```bash
git add .
git commit -m "Chess MVP: rules, Stockfish AI, save games"
git push
```

## Шаг 2 — Деплой на Vercel (бесплатно)

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. **Add New… → Project**
3. Выберите репозиторий **chess-app**
4. Настройки оставьте как есть:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output: `build`
5. Нажмите **Deploy**
6. Через 1–2 минуты получите ссылку вида: `https://chess-app-xxx.vercel.app`

**Эту ссылку отправляйте на отбор.**

## Шаг 3 — Проверка

Откройте ссылку на телефоне и компьютере:

- Ходите белыми (перетаскивание фигуры)
- Через ~0.5 сек чёрные отвечают (Stockfish)
- «Новая игра» сбрасывает партию
- После мат/ничьей партия появляется в «История игр»

## Локальный запуск

```bash
npm install
npm start
```

Браузер: http://localhost:3000

## Документация проекта

Полный план MVP: `vibe_docs/plan.md`
