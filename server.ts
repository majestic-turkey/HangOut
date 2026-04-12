/**
* Server for multiplayer Hangman game using WebSockets
*/

// Packages
import express from 'express';
import http from 'http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';

// Helpers
import {
    addChatMessage,
    fetchChatMessages,
    initDB,
    saveGameState,
    clearChatMessages } from './src/db.ts';
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

    // Dehydrate sets to arrays for transmission, manually rehydrate them on the client side
    // Complete gamestate is sent with every update to ensure that clients can rehydrate the full state if needed (e.g. on reconnect)
    return {
        maskedWord,
        attemptsLeft,
        gameState: {
            word: manager.word,
            guessedLetters: Array.from(manager.guessedLetters),
            wrongLetters: Array.from(manager.wrongLetters),
            maxAttempts: manager.maxAttempts,
            attempts: manager.attempts,
            gameWon: manager.gameWon,
            winnerId: manager.winnerId,
            gameId: manager.gameId,
            maskedWord,
            attemptsLeft
        }
    };
}

function getConnectedPlayers(game: GameSession) {
    return Array.from(game.manager.players).map((player) => ({
        socketId: player.socketId,
        userName: player.userName
    }));
}

function emitPlayerList(game: GameSession) {
    io.to(game.id).emit('player_list', getConnectedPlayers(game));
}

// Serve static elements
app.use(express.static(distPath));

// Initialize the database
await initDB();

// Generate a unique 8-character game ID
function createGameId() {
    return nanoid(4);
}

function findGameById(input: string | undefined) {
    if (!input) return undefined;
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    // Prefer exact match, then fallback to case-insensitive lookup for mobile keyboard variance.
    const exact = games.get(trimmed);
    if (exact) return exact;

    const lower = trimmed.toLowerCase();
    for (const [id, game] of games.entries()) {
        if (id.toLowerCase() === lower) return game;
    }

    return undefined;
}

// On client connection
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for new game requests from clients
    socket.on('new_game', async (payload, maxAttempts = 6) => {
        const wordLength = Number.isInteger(payload?.wordLength) ? payload.wordLength : 6;
        const requestedMaxAttempts = Number.isInteger(maxAttempts) ? maxAttempts : 6;
        const userName = typeof payload?.userName === 'string' && payload.userName.trim() ? payload.userName.trim() : 'Guest';
        console.log(`New game started by ${userName} with word length ${wordLength} and max attempts ${requestedMaxAttempts}`);
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
            const gameSession: GameSession = {
                id: gameId,
                manager: gameManager,
                players: new Set([socket.id]),
                createdAt: Date.now()
            };
            games.set(gameId, gameSession);

            // Join the socket to a room with the game ID so that messages can be broadcast to all players in the same game
            await socket.join(gameId);
            socket.data.gameId = gameId;
            socket.data.userName = userName;
            gameManager.addOrUpdatePlayer(socket.id, userName);

            // And finally emit the initial masked word to the clients
            io.to(gameId).emit("masked_word", createPayload(gameManager));
            emitPlayerList(gameSession);

        } catch (error) {
            console.error('Error starting new game:', error);
        }
    });

    // Listen for join game requests from clients
    socket.on('join_game', async (payload, ack) => {
        const { gameId, userName } = payload;
        console.log(`User ${userName} (${socket.id}) is trying to join game ${gameId}`);
        const game = findGameById(typeof gameId === 'string' ? gameId : undefined);
        if (!game) return ack?.({ ok: false, message: "Game not found" });

        await socket.join(game.id);
        socket.data.gameId = game.id;
        const normalizedUserName = typeof userName === 'string' && userName.trim() ? userName.trim() : 'Guest';
        socket.data.userName = normalizedUserName;
        game.manager.addOrUpdatePlayer(socket.id, normalizedUserName);

        // Add the player to the game and send them the current masked word and chat
        game.players.add(socket.id);
        socket.emit("masked_word", createPayload(game.manager));
        emitPlayerList(game);
        ack?.({ ok: true, message: "Joined game successfully" });
    })

    socket.on('get_player_list', () => {
        const gameId = socket.data.gameId;
        const game = games.get(gameId);
        if (!game) return;

        socket.emit('player_list', getConnectedPlayers(game));
    });

    socket.on('get_chat_history', async () => {
        const gameId = socket.data.gameId;
        if (!gameId) return;

        const chatMessages = await fetchChatMessages(gameId);
        socket.emit('incoming_message', chatMessages);
    });

    // Restart the current game for all players in the same room.
    socket.on('continue_game', async (ack) => {
        const gameId = socket.data.gameId;
        const game = games.get(gameId);
        if (!game || !gameId) {
            return ack?.({ ok: false, message: 'Game not found' });
        }

        const nextWordLength = game.manager.word.length || undefined;
        await game.manager.startNewGame(game.id, nextWordLength);
        io.to(game.id).emit('masked_word', createPayload(game.manager));
        ack?.({ ok: true, message: 'Game restarted' });
    });

    // Listen for guesses from clients
    socket.on('keypress', async (key) => {
        console.log(`User ${socket.id} pressed key ${key}`);
        // Grab the game info
        const gameId = socket.data.gameId;
        const game = games.get(gameId);

        // Validate that the game exists and that the key pressed is a valid letter
        if (!game || !gameId || !/^[a-z]$/i.test(key)) return;

        // Rate limit guesses to prevent spamming every 1 seconds
        const now = Date.now();
        if (socket.data.lastGuessTime && now - socket.data.lastGuessTime < 1000) {
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
            await clearChatMessages(game.manager.gameId);
        }
    });

    // Listen for chat messages, save them to the database and broadcast
    socket.on('sent_message', async (message) => {
        const gameId = socket.data.gameId;
        if (!gameId) return;
        const normalizedMessage = typeof message === 'string' ? message.trim() : '';
        if (!normalizedMessage) return;
        const game = games.get(gameId);
        const userName = typeof socket.data.userName === 'string' && socket.data.userName.trim()
            ? socket.data.userName.trim()
            : game?.players.has(socket.id)
                ? game.manager.getPlayerName(socket.id)
                : 'Guest';
        const chatMessage = { socketId: socket.id, userName, message: normalizedMessage };

        await addChatMessage(gameId, socket.id, userName, normalizedMessage);
        io.to(gameId).emit('incoming_message', chatMessage);
    });


    // Listen for client disconnects
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
        const gameId = socket.data.gameId;
        const game = games.get(gameId);

        if (!game) return;

        // Remove the disconnected player from the game's player list
        game.players.delete(socket.id);
        game.manager.removePlayer(socket.id);
        
        // If no players remain in the game, remove the game from the registry
        if (game.players.size === 0) {
            games.delete(gameId);
        } else {
            emitPlayerList(game);
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