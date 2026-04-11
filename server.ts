/**
* Server for multiplayer Hangman game using WebSockets
*/
import express from 'express';
import http from 'http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import { initDB, saveGameState } from './src/db.ts';
import GameManager from './src/gameManager.ts';
import type { GameSession } from './src/types.ts';

// Load environment variables from .env file and set constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'frontend', 'dist');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 60000, // Allow reconnection within 60 seconds
        skipMiddlewares: true // Skip any middlewares when recovering a connection
    }
});
const games = new Map<string, GameSession>();

function createPayload(manager: GameSession['manager'], overrides?: { maskedWord?: string; attemptsLeft?: number }) {
    const maskedWord = overrides?.maskedWord ?? manager.getMaskedWord();
    const attemptsLeft = overrides?.attemptsLeft ?? manager.maxAttempts - manager.attempts;

    // TODO: Revisit payload shape for socket transport.
    // Sets are not JSON-safe over socket payloads; serialize them as arrays here:
    // gameState: {
    //   word: manager.word,
    //   guessedLetters: Array.from(manager.guessedLetters),
    //   wrongLetters: Array.from(manager.wrongLetters),
    //   maxAttempts: manager.maxAttempts,
    //   attempts: manager.attempts,
    //   gameWon: manager.gameWon,
    //   winnerId: manager.winnerId,
    //   gameId: manager.gameId,
    //   maskedWord,
    //   attemptsLeft
    // }

    return {
        maskedWord,
        attemptsLeft,
        gameState: {
            ...manager,
            maskedWord,
            attemptsLeft
        }
    };
}

// Serve static elements
app.use(express.static(distPath));

// Initialize the database
await initDB();

// Generate a unique 8-character game ID
function createGameId() {
    return nanoid(8);
}

// On client connection
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for new game requests from clients
    socket.on('new_game', async (payload, maxAttempts = 6) => {
        const wordLength = Number.isInteger(payload?.wordLength) ? payload.wordLength : 6;
        const requestedMaxAttempts = Number.isInteger(maxAttempts) ? maxAttempts : 6;
        console.log(`New game started by ${socket.id} with word length ${wordLength} and max attempts ${requestedMaxAttempts}`);
        try {

            // Initialize a new game
            let gameId = createGameId();
            const gameManager = new GameManager(requestedMaxAttempts);
            if (games.has(gameId)) {
                console.warn(`Game ID collision detected: ${gameId}. Generating a new ID.`);
                gameId = createGameId();
            }
            await gameManager.startNewGame(gameId, wordLength);

            // Add game to registry of games
            games.set(gameId, {
                id: gameId,
                manager: gameManager,
                players: new Set([socket.id]),
                createdAt: Date.now()
            });

            // Join the socket to a room with the game ID so that messages can be broadcast to all players in the same game
            await socket.join(gameId);
            socket.data.gameId = gameId;

            // And finally emit the initial masked word to the clients
            io.to(gameId).emit("masked_word", createPayload(gameManager));

        } catch (error) {
            console.error('Error starting new game:', error);
        }
    });

    // Listen for join game requests from clients
    socket.on('join_game', async (gameId, ack) => {
        console.log(`User ${socket.id} is trying to join game ${gameId}`);
        const game = games.get(gameId);
        if (!game) return ack?.({ ok: false, message: "Game not found" });

        await socket.join(gameId);
        socket.data.gameId = gameId;
        io.to(gameId).emit("player_joined", {
            socketId: socket.id
        });

        // Add the player to the game and send them the current masked word
        game.players.add(socket.id);
        socket.emit("masked_word", createPayload(game.manager));
        ack?.({ ok: true, message: "Joined game successfully" });
    })

    // Listen for guesses from clients
    socket.on('keypress', async (key) => {
        console.log(`User ${socket.id} pressed key ${key}`);
        // Grab the game info
        const gameId = socket.data.gameId;
        const game = games.get(gameId);

        // Validate that the game exists and that the key pressed is a valid letter
        if (!game || !gameId || !/^[a-z]$/i.test(key)) return;

        // Rate limit guesses to prevent spamming every 2 seconds
        const now = Date.now();
        if (socket.data.lastGuessTime && now - socket.data.lastGuessTime < 2000) {
            console.log(`User ${socket.id} is guessing too fast. Ignoring guess.`);
            return;
        }
        socket.data.lastGuessTime = now;

        // If the game is over, ignore any further guesses
        if (game.manager.gameWon || game.manager.attempts >= game.manager.maxAttempts) {
            console.log(`Game ${gameId} is already over. Ignoring guess.`);
            return;
        }

        // Make the guess and update the game state
        const changed = JSON.parse(await game.manager.guessLetter(key.toLowerCase().trim()));
        if (!changed.accepted) return; // If the guess was invalid, ignore it

        console.log(`Game ${gameId}: Remaining attempts ${game.manager.maxAttempts - game.manager.attempts}`);

        // Broadcast the updated game state to all players in the game
        io.to(gameId).emit("masked_word", {
            ...changed,
            ...createPayload(game.manager, {
                maskedWord: changed.maskedWord,
                attemptsLeft: changed.attemptsLeft
            })
        });

        // Check if the game is over
        if (game.manager.gameWon || game.manager.attempts >= game.manager.maxAttempts) {
            console.log(`Game over for game ${gameId}. Won: ${game.manager.gameWon}, Word: ${game.manager.word}`);
            io.to(gameId).emit("game_over", {
                gameWon: game.manager.gameWon,
                word: game.manager.word
            });
            game.manager.winnerId = game.manager.gameWon ? socket.id : undefined;
            await saveGameState(game.manager);
        }
    })

    // Listen for client disconnects
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
        const gameId = socket.data.gameId;
        const game = games.get(gameId);

        if (!game) return;

        // Remove the disconnected player from the game's player list
        game.players.delete(socket.id);
        
        // If no players remain in the game, remove the game from the registry
        if (game.players.size === 0) {
            games.delete(gameId);
        } else {
            io.to(gameId).emit("player_left", {
                socketId: socket.id
            });
        }

    });

});

// Serve the frontend application for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT || 3000}`);
})