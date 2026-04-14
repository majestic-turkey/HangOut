import { findOrCreateUser, getPlayerWins } from "../db/users.ts";
import type { GameSession } from "../types.ts";

export async function getConnectedPlayers(game: GameSession) {
    for (const player of game.manager.players) {
        await findOrCreateUser(player.userName).catch((error) => {
            console.error('Error ensuring user exists in database:', error);
        });
    }
    return Promise.all(
        Array.from(game.manager.players).map(async (player) => ({
            socketId: player.socketId,
            userName: player.userName,
            wins: await getPlayerWins(player.userName)
        }))
    );
}