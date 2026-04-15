/**
* Server for multiplayer Hangman game using WebSockets
*/

// Packages
import express from 'express';
import http from 'http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';

// Helpers and Middleware
import { initDB } from './src/db/db.ts';
import DataBase from './src/db/db.ts';
import { setupSocketHandlers } from './src/socket/socketHandlers.ts';
import session from 'express-session';

declare module 'express-session' {
    interface SessionData {
        userId?: string;
    }
}

// Load environment variables from .env file and set constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const SESSION_SECRET: string = process.env.SESSION_SECRET || 'default_secret';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'frontend', 'dist');

// Create Express app and initialize middleware
const app = express();
app.use(session({ // Session tracking
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60 // 1 hour session duration
    }
}));
app.use(express.static(distPath)); // Serve static files from the frontend build directory

// Check for session userID
app.get('/me', (req, res) => {
    if (req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ error: 'User not authenticated' });
    }
});

// Create HTTP server and initialize Socket.IO with CORS and connection recovery options
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
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        DataBase.close().then(() => {
            console.log('Database connection closed');
        }).catch((error) => {
            console.error('Error closing database connection:', error);
        });
    });
});