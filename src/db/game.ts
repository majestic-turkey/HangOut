/**
 * Database module for managing game state
 */

import DataBase from './db.ts';
import type { GameState, SaveStateProps } from '../types.ts';
import { findOrCreateUser, incrementPlayerWins } from './users.ts';
import { clearChatMessages } from './chat.ts';

// Create a new game
export async function createGame(word: string, gameId: string) {
    try {
        await DataBase.run('INSERT INTO games (word, game_id, played_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [word, gameId]);
    } catch (error) {
        console.error('Error creating game:', error);
    }
}

// Save the current game state to the database
export async function saveGameState({ gameId, winnerId, word, gameWon }: SaveStateProps) {
    try {
        if (gameWon) {
            const user = winnerId ? await findOrCreateUser(winnerId) : null;
            if (user) {
                await incrementPlayerWins(user.username);
                await DataBase.run('UPDATE games SET winner_id = ?, word = ? WHERE game_id = ?', [user.username, word, gameId]);
            }
            await clearChatMessages(gameId);
            return true;
        } else if (word && !winnerId) {
            await DataBase.run('UPDATE games SET word = ?, played_at = CURRENT_TIMESTAMP WHERE game_id = ?', [word, gameId]);
            return true;
        }
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    }
}

// Allow deletion of a game after 24 hours to prevent stale games from accumulating indefinitely
export async function deleteOldGames() {
    try {
        await DataBase.run('DELETE FROM games WHERE played_at <= datetime("now", "-1 day")');
    } catch (error) {
        console.error('Error deleting old games:', error);
    }
}

