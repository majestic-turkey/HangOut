/**
* Server for multiplayer Hangman game using WebSockets
*/

// Packages
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';

// Helpers and Middleware
import { initDB, createUser, verifyPassword } from './src/db/db.ts';
import DataBase from './src/db/db.ts';
import { setupSocketHandlers } from './src/socket/socketHandlers.ts';
import session from 'express-session';

declare module 'express-session' {
    interface SessionData {
        userId?: number;
    }
}

declare module 'http' {
    interface IncomingMessage {
        session: import('express-session').Session & import('express-session').SessionData;
    }
}

// Load environment variables from .env file and set constants
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set.');
}
const SESSION_SECRET: string = process.env.SESSION_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'frontend', 'dist');
const sessionConfig = 
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 // 1 hour session duration
        }
    });

// Create Express app and initialize middleware
const app = express();
app.use(sessionConfig);
app.use(express.static(distPath)); // Serve static files from the frontend build directory

// API route for user authentication (login, register)
app.post('/auth', express.json(), async (req, res) => {
    const { username, password, authAction } = req.body;
    // Validate input
    const invalidInput = typeof username !== 'string' || typeof password !== 'string';
    if (invalidInput) {
        return res.status(400).json({ ok: false, message: 'Username and password must be strings' });
    }
    try {
        // Login logic: verify credentials and create session
        if (authAction === 'login') {
            try {
            const userRecord = await verifyPassword(username, password);
            if (userRecord) {
                req.session.regenerate((err) => {
                    if (err) {
                        res.status(500).json({ ok: false, message: 'Internal server error' });
                    } else {
                        req.session.userId = userRecord.id;
                        res.json({ ok: true, message: 'Login successful', userId: userRecord.id });
                    }
                });
            } else {
                res.status(401).json({ ok: false, message: 'Invalid username or password' });
            }
        } catch (error) {
            if (error instanceof Error && /invalid/i.test(error.message)) {
                res.status(401).json({ ok: false, message: error.message });
            } else {
                res.status(500).json({ ok: false, message: 'Internal server error' });
            }
        }
        } else if (authAction === 'register') {
            // Registration logic: create new user and create session
            try {
                const newUser = await createUser(username, password);
                req.session.regenerate((err) => {
                    if (err) {
                        res.status(500).json({ ok: false, message: err.message || 'Internal server error' });
                    } else {
                        req.session.userId = newUser.id;
                        res.json({ ok: true, message: 'Registration successful', userId: newUser.id });
                    }
                });
            } catch (error) {
                if (error instanceof Error && /already exists/i.test(error.message)) {
                    res.status(409).json({ ok: false, message: error.message });
                } else {
                    res.status(500).json({ ok: false, message: 'Internal server error' });
                }
            }
        } else {
            res.status(400).json({ ok: false, message: 'Invalid authentication action' });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
});

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
    }
});

// Add socket middleware to expose session data
io.use((socket, next) => {
    sessionConfig(socket.request as any, {} as any, (err?: unknown) => {
        if (err) next(err instanceof Error ? err : new Error(String(err)));
        else next();
    });
});

setupSocketHandlers(io);

// Initialize the database
await initDB();

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ ok: false, message: 'Internal server error' });
        } else {
            res.json({ ok: true, message: 'Logout successful' });
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
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);