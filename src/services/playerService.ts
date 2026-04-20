import { getPlayerWins } from "../db/users.ts";
import type { GameSession } from "../types.ts";

export async function getConnectedPlayers(game: GameSession) {
    return Promise.all(
        Array.from(game.manager.players).map(async (player) => ({
            socketId: player.socketId,
            userName: player.userName,
            wins: await getPlayerWins(player.userName)
        }))
    );
}