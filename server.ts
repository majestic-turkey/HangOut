/**
* Server for multiplayer Hangman game using WebSockets
*/
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { initDB } from './src/db.js';
import GameManager from './src/gameManager.ts';
import type { GameSession } from './src/types.ts';

// Load environment variables from .env file and set constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
const games = new Map<string, GameSession>();

// Serve static elements
app.use(express.static('public'));

// Initialize the database
const db = await initDB();

function createGameId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// On client connection
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for new game requests from clients
    socket.on('new_game', async () => {
        console.log(`New game started by ${socket.id}`);
        try {

            // Initialize a new game
            const gameId = createGameId();
            const gameManager = new GameManager();
            await gameManager.startNewGame(gameId);

            // Add game to registry of games
            games.set(gameId, {
                id: gameId,
                manager: gameManager,
                players: new Set([socket.id]),
                createdAt: Date.now()
            });

            // Join the socket to a room with the game ID so that messages can be broadcast to all players in the same game
            socket.join(gameId);
            socket.data.gameId = gameId;

            // And finally emit the initial masked word to the clients
            io.to(gameId).emit("masked_word", {
                maskedWord: gameManager.getMaskedWord()
            });

        } catch (error) {
            console.error('Error starting new game:', error);
        }
    });

    // Listen for join game requests from clients
    socket.on('join_game', (gameId, ack) => {
        const game = games.get(gameId);
        if (!game) return ack?.({ ok: false, message: "Game not found" });

        socket.join(gameId);
        socket.data.gameId = gameId;
        io.to(gameId).emit("player_joined", {
            socketId: socket.id
        });

        // Add the player to the game and send them the current masked word
        game.players.add(socket.id);
        socket.emit("masked_word", {
            maskedWord: game.manager.getMaskedWord()
        });
        ack?.({ ok: true, message: "Joined game successfully" });
    })

    // Listen for guesses from clients
    socket.on('keypress', (key) => {
        // Grab the game info
        const gameId = socket.data.gameId;
        const game = games.get(gameId);

        // Validate that the game exists and that the key pressed is a valid letter
        if (!game || !gameId || !/^[a-z]$/i.test(key)) return;

        // Make the guess and update the game state
        const changed = game.manager.guessLetter(key);
        if (!changed) return;
        io.to(gameId).emit("masked_word", {
            maskedWord: game.manager.getMaskedWord()
        });

        // Check if the game is over
        if (game.manager.gameWon || game.manager.attempts >= game.manager.maxAttempts) {
            io.to(gameId).emit("game_over", {
                gameWon: game.manager.gameWon,
                word: game.manager.word
            });
        }
    })

    // Listen for client disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        const gameId = socket.data.gameId;
        const game = games.get(gameId);

        if (!games || !game) return;

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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT || 3000}`);
})