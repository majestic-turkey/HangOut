/**
* Server for multiplayer Hangman game using WebSockets
*/
import express from 'express';
import http from 'http';
import path from 'node:path';
import { Server } from 'socket.io';

// Load environment variables from .env file and set constants
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Derived constants
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Serve static elements
app.use(express.static('public'));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT || 3000}`);
})