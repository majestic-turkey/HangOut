/** 
 * Utility functions for the HangOut game server
 */

import { getPlayerWins } from "./db/db.ts";
import type { GameSession } from "./types.ts";
import { nanoid } from "nanoid";
import { getConnectedPlayers } from "./services/playerService.ts";

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

async function getConnectedPlayers(game: GameSession) {
    return Promise.all(
        Array.from(game.manager.players).map(async (player) => ({
            socketId: player.socketId,
            userName: player.userName,
            wins: await getPlayerWins(player.userName)
        }))
    );
}

async function emitPlayerList(game: GameSession, io: any) {
    io.to(game.id).emit('player_list', await getConnectedPlayers(game));
}

// Generate a unique 4-character game ID
function createGameId() {
    return nanoid(4);
}

function findGameById(input: string | undefined, games: Map<string, GameSession>) {
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

export { 
    createPayload,
    getConnectedPlayers,
    emitPlayerList,
    createGameId,
    findGameById };