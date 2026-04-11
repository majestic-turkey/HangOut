# HangOut Frontend

React + TypeScript + Vite client for the HangOut multiplayer hangman app.

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite starts on http://localhost:5173 by default.

The client connects to the backend at `http://localhost:3000` (configured in `src/socket.ts`).

## Build

```bash
npm run build
```

Output is written to `frontend/dist`.

## Preview Production Build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Main Files

- `src/App.tsx`: app shell and socket event listeners
- `src/components/TitleScreen.tsx`: start game action
- `src/components/GameBoard.tsx`: gameplay UI and keyboard capture
- `src/socket.ts`: Socket.IO client setup
