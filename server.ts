/**
* Server for multiplayer Hangman game using WebSockets
*/
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables from .env file and set constants
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static elements
app.use(express.static('public'));

// On client connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT || 3000}`);
})