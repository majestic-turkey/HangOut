/**
* Server for multiplayer Hangman game using WebSockets
*/

// Packages
import express from 'express';
import http from 'http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';

// Helpers
import DataBase, { initDB } from './src/db/db.ts';
import { setupSocketHandlers} from './src/socket/socketHandlers.ts';

// Load environment variables from .env file and set constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'frontend', 'dist');
const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: "*"
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 60000, // Allow reconnection within 60 seconds
        skipMiddlewares: true // Skip any middlewares when recovering a connection
    }
});

setupSocketHandlers(io);

// Serve static elements
app.use(express.static(distPath));

// Initialize the database
await initDB();

// Serve the frontend application for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT || 3000}`);
})

// Gracefully handle server shutdown and close the database connection
function shutdown() {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        DataBase.close().then(() => {
            console.log('Database connection closed');
        }).catch((error) => {
            console.error('Error closing database connection:', error);
        });
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);