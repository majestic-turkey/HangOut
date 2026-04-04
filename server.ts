/**
* Server for multiplayer Hangman game using WebSockets
*/
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { initDB, saveGameState } from './src/db';
import GameManager from './src/gameManager';

// Load environment variables from .env file and set constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Serve static elements
app.use(express.static('public'));

// Initialize the database
await initDB();

// On client connection
io.on('connection', async (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });

    socket.on('keypress', (key) => {
        console.log(`Key pressed by ${socket.id}: ${key}`);
        io.emit('keypress', { id: socket.id, key });
    });

    socket.on('new_game', async () => {
        console.log(`New game started by ${socket.id}`);
        try {
            // Create a new game instance
            const gameManager = new GameManager();
            await gameManager.startNewGame();

            // Save the game state to the database
            await saveGameState(gameManager);
        } catch (error) {
            console.error('Error starting new game:', error);
        }
    });

});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT || 3000}`);
})