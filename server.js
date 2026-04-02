"use strict";
exports.__esModule = true;
/**
* Server for multiplayer Hangman game using WebSockets
*/
var express_1 = require("express");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
// Load environment variables from .env file and set constants
var PORT = process.env.PORT || 3000;
var app = (0, express_1["default"])();
var server = http_1["default"].createServer(app);
var io = new socket_io_1.Server(server);
// Serve static elements
app.use(express_1["default"].static('public'));
// On client connection
io.on('connection', function (socket) {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', function () {
        console.log('A user disconnected:', socket.id);
    });
});
server.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT || 3000));
});
