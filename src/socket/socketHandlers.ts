/**
 * Socket.IO event handlers
 */
import type { GameSession, Payload, Ack } from '../types.ts';

import {
    getConnectedPlayers,
    findGameById,
    createGameId,
    emitPlayerList,
    createPayload
} from '../utils.ts';

import {
    addChatMessage,
    fetchChatMessages,
    clearChatMessages,
    saveGameState,
    deleteOldGames,
    createUser,
    verifyPassword,
    createGame
} from '../db/db.ts';

import GameManager from '../gameManager.ts';
import { Server } from 'socket.io';
import type SocketIO from 'socket.io';

const MAX_CHAT_LENGTH = 200; // Maximum length for chat messages to prevent abuse

// Initialize game registry
const games = new Map<string, GameSession>();

function normalizeUserName(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : 'Guest';
}

async function authenticatePlayer(payload: Payload) {
    const authAction = payload?.authAction ?? 'guest';
    const userName = normalizeUserName(payload?.userName);

    if (authAction === 'guest') {
        return { userName };
    }

    const password = typeof payload?.password === 'string' ? payload.password.trim() : '';
    const hasExplicitUserName = typeof payload?.userName === 'string' && payload.userName.trim();
    if (!hasExplicitUserName || !password) {
        throw new Error('Username and password are required');
    }

    if (authAction === 'register') {
        const user = await createUser(userName, password);
        return { userName: user.username, userId: user.id };
    }

    if (authAction === 'login') {
        const user = await verifyPassword(userName, password);
        if (!user) {
            throw new Error('Invalid username or password');
        }
        return { userName: user.username, userId: user.id };
    }

    throw new Error('Unsupported auth action');
}

// On client connection
export function setupSocketHandlers(io: Server) {
    io.on('connection', async (socket: SocketIO.Socket) => {
        console.log('A user connected:', socket.id);

        // Listen for new game requests from clients
        socket.on('new_game', async (payload: Payload, ack: ((response: Ack) => void) | undefined) => {
            const wordLength = Number.isInteger(payload?.wordLength) ? payload.wordLength : 6;
            const requestedMaxAttempts = typeof payload?.maxAttempts === 'number' && Number.isInteger(payload.maxAttempts)
                ? payload.maxAttempts
                : 6;
            try {
                const authResult = await authenticatePlayer(payload);
                const userName = authResult.userName;
                console.log(`New game started by ${userName} with word length ${wordLength} and max attempts ${requestedMaxAttempts}`);

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
                socket.data.userId = authResult.userId;
                gameManager.addOrUpdatePlayer(socket.id, userName);

                // And finally emit the initial masked word to the clients
                io.to(gameId).emit("masked_word", createPayload(gameManager));
                emitPlayerList(gameSession, io);
                ack?.({ ok: true, message: 'Game started successfully' });

            } catch (error) {
                console.error('Error starting new game:', error);
                ack?.({ ok: false, message: error instanceof Error ? error.message : 'Unable to start game' });
            }
        });

        // Listen for join game requests from clients
        socket.on('join_game', async (payload: Payload, ack: ((response: Ack) => void) | undefined) => {
            const { gameId, userName, password } = payload;
            console.log(`User ${userName} (${socket.id}) is trying to join game ${gameId}`);
            const game = findGameById(typeof gameId === 'string' ? gameId : undefined, games);
            if (!game) return ack?.({ ok: false, message: "Game not found" });

            let authResult: { userName: string; userId?: number };
            try {
                authResult = await authenticatePlayer(payload);
            } catch (error) {
                return ack?.({ ok: false, message: error instanceof Error ? error.message : 'Unable to join game' });
            }

            // Join the socket to the game room and save the game ID and username in the socket's data for later reference
            await socket.join(game.id);
            socket.data.gameId = game.id;
            const normalizedUserName = authResult.userName;
            socket.data.userName = normalizedUserName;
            socket.data.userId = authResult.userId;
            game.manager.addOrUpdatePlayer(socket.id, normalizedUserName);

            // Add the player to the game and send them the current masked word and chat
            game.players.add(socket.id);
            socket.emit("masked_word", createPayload(game.manager));
            emitPlayerList(game, io);
            ack?.({ ok: true, message: "Joined game successfully" });
        })

        socket.on('get_player_list', async () => {
            const gameId = socket.data.gameId;
            const game = games.get(gameId);
            if (!game) return;

            socket.emit('player_list', await getConnectedPlayers(game));
        });

        socket.on('get_chat_history', async () => {
            const gameId = socket.data.gameId;
            if (!gameId) return;

            const chatMessages = await fetchChatMessages(gameId);
            socket.emit('incoming_message', chatMessages);
        });

        // Restart the current game for all players in the same room.
        socket.on('continue_game', async (ack: ((response: Ack) => void) | undefined) => {
            const gameId = socket.data.gameId;
            const game = games.get(gameId);
            if (!game || !gameId) {
                return ack?.({ ok: false, message: 'Game not found' });
            }

            const nextWordLength = game.manager.word.length || undefined;
            try {
                game.manager.startNewGame(game.id, nextWordLength);
                await createGame(game.manager.word, game.manager.gameId);
            } catch (error) {
                console.error('Error starting new game:', error);
                return ack?.({ ok: false, message: 'Failed to start new game' });
            }
            io.to(game.id).emit('masked_word', createPayload(game.manager));
            ack?.({ ok: true, message: 'Game restarted' });
        });

        // Listen for guesses from clients
        socket.on('keypress', async (key: string) => {
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
            const changed = JSON.parse(game.manager.guessLetter(key.toLowerCase().trim()));
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
                await clearChatMessages(game.manager.gameId);
                await deleteOldGames();
            }
            await saveGameState({
                gameId: game.manager.gameId,
                winnerId: game.manager.winnerId,
                word: game.manager.word,
                gameWon: game.manager.gameWon,
                game: game.manager
            }); // Keep a record of the current game state to facilitate reconnections
        });

        // Listen for chat messages, save them to the database and broadcast
        socket.on('sent_message', async (message: string) => {
            const gameId = socket.data.gameId;
            if (!gameId) return;
            const normalizedMessage = typeof message === 'string' ? message.trim() : '';
            if (!normalizedMessage || normalizedMessage.length > MAX_CHAT_LENGTH) return;
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
                emitPlayerList(game, io);
            }

        });

    });
}