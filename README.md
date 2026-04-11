
# HangOut

Multiplayer Hangman built with Node.js, TypeScript, Socket.IO, React, and SQLite.

## What It Does

- Creates real-time hangman sessions over websockets.
- Broadcasts game state updates to all players in a game room.
- Persists game records in SQLite.
- Uses a local word list with fallback words if a requested length is unavailable.

## Tech Stack

- Backend: Express + Socket.IO + TypeScript
- Frontend: React + TypeScript + Vite
- Data: SQLite

## Project Structure

```text
.
|-- server.ts              # Backend entrypoint
|-- src/                   # Backend game logic, DB, word service
|-- frontend/              # Vite React client
`-- hangman.db             # SQLite DB (created at runtime)
```

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

Install dependencies for both the backend and frontend:

```bash
# from repo root
npm install
npm --prefix frontend install
```

## Running Locally

From the repo root:

```bash
# Run backend + frontend together
npm run dev

# Run backend only
npm start

# Run frontend only
npm run dev:client
```

Default URLs:

- Backend: http://localhost:3000
- Frontend (Vite): http://localhost:5173

## Gameplay Flow

1. A player starts a new game.
2. The server creates an 8-character game ID and chooses a word.
3. Players guess letters from the keyboard.
4. The server validates each guess and emits updated state.
5. When won or attempts are exhausted, game-over state is emitted and saved.

## Socket Events

- Client -> Server: `new_game`, `join_game`, `keypress`, `continue_game`
- Server -> Client: `masked_word`, `game_over`, `player_joined`, `player_left`

## Data Persistence

On startup, the app initializes SQLite tables:

- `games`: stores played games and winner information
- `users`: stores usernames and win counts

Database file path: `./hangman.db`

## Notes

- The frontend socket client is currently configured for `http://localhost:3000`.
- CORS is open (`*`) for local development.

## Troubleshooting

### Frontend cannot connect to backend

- Confirm the backend is running on port `3000`.
- Check `frontend/src/socket.ts` points to `http://localhost:3000`.
- If port `3000` is already in use, free it or set a new backend `PORT` and update the frontend socket URL to match.

### Blank page or missing static assets in production mode

- Build the frontend first with `npm --prefix frontend run build`.
- Then start the backend from the repo root using `npm start`.
- The server expects frontend files in `frontend/dist`.

### Database not updating

- Ensure the process can write to the project directory.
- Verify `hangman.db` exists in the repo root after startup.
- Restart the server if schema initialization was interrupted.

### Port already in use

- On Windows, find the process using port `3000`:
	`netstat -ano | findstr :3000`
- Then stop it:
	`taskkill /PID <pid> /F`

### Guesses seem ignored

- The server rate-limits guesses to one every 1 second per socket.
- Only alphabetic single-letter guesses are accepted.

## Scripts (Root)

- `npm run dev`: run server and client concurrently
- `npm start`: run server in watch mode
- `npm run typecheck`: type-check backend TypeScript
- `npm run build`: run backend typecheck and frontend production build
- `npm run dev:server`: run backend watcher directly
- `npm run dev:client`: run Vite frontend dev server

## License

ISC
