/** 
 * Database setup
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import type { GameState } from './types.ts';

export async function openDB() {
    return open({
        filename: './hangman.db',
        driver: sqlite3.Database
    });
}

// Create a new game
export async function createGame(word: string, gameId: string, userName: string) {
    const db = await openDB();
    try {
        await db.run('INSERT INTO games (word, game_id, played_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [word, gameId]);
    } catch (error) {
        console.error('Error creating game:', error);
    } finally {
        await db.close();
    }
}

// Add a chat message
export async function addChatMessage(gameId: string, userId: string, userName: string, message: string) {
    const db = await openDB();
    try {
        await db.run(
            'INSERT INTO chats (game_id, user_id, user_name, message, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [gameId, userId, userName, message]
        );
    } catch (error) {
        console.error('Error adding chat message:', error);
    } finally {
        await db.close();
    }
}

// Fetch chat messages for a specific game
export async function fetchChatMessages(gameId: string) {
    const db = await openDB();
    try {
        return await db.all(
            `SELECT
                user_id AS socketId,
                COALESCE(user_name, 'Guest') AS userName,
                message
            FROM chats
            WHERE game_id = ?
            ORDER BY sent_at ASC`,
            [gameId]
        );
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return [];
    } finally {
        await db.close();
    }
}

// Clear a game's chat messages after the game ends
export async function clearChatMessages(gameId: string) {
    const db = await openDB();
    try {
        await db.run('DELETE FROM chats WHERE game_id = ?', [gameId]);
    } catch (error) {
        console.error('Error clearing chat messages:', error);
    } finally {
        await db.close();
    }
}

// Get the win count for a user by username
export async function getPlayerWins(userName: string): Promise<number> {
    const db = await openDB();
    try {
        const row = await db.get<{ wins: number }>('SELECT wins FROM users WHERE username = ?', [userName]);
        return row?.wins ?? 0;
    } catch (error) {
        console.error('Error fetching player wins:', error);
        return 0;
    } finally {
        await db.close();
    }
}

// Look up a user by username, creating them if they don't exist
export async function findOrCreateUser(userName: string): Promise<{ id: number; username: string; wins: number }> {
    const db = await openDB();
    try {
        let row = await db.get<{ id: number; username: string; wins: number }>('SELECT id, username, wins FROM users WHERE username = ?', [userName]);
        if (!row) {
            const result = await db.run('INSERT INTO users (username) VALUES (?)', [userName]);
            row = { id: result.lastID || 0, username: userName, wins: 0 };
        }
        return row || { id: 0, username: userName, wins: 0 };
    } catch (error) {
        console.error('Error finding or creating user:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Increment a user's win count by username
export async function incrementPlayerWins(userName: string) {
    const db = await openDB();
    try {
        await db.run('UPDATE users SET wins = wins + 1 WHERE username = ?', [userName]);
    } catch (error) {
        console.error('Error incrementing player wins:', error);
    } finally {
        await db.close();
    }
}

// Save the current game state to the database
export async function saveGameState(gameState: GameState) {
    const db = await openDB();
    try {
        if (gameState.gameWon) {
            await db.run('UPDATE games SET winner_id = ?, word = ? WHERE game_id = ?', [gameState.winnerId, gameState.word, gameState.gameId]);
            const user = await findOrCreateUser(gameState.getPlayerName(gameState.winnerId!));
            if (user) {
                await incrementPlayerWins(user.username);
            }
            await clearChatMessages(gameState.gameId);
            return true;
        } else if (gameState.word && !gameState.winnerId) {
            await db.run('UPDATE games SET word = ?, played_at = CURRENT_TIMESTAMP WHERE game_id = ?', [gameState.word, gameState.gameId]);
            return true;
        }
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    } finally {
        await db.close();
    }

}

// Allow deletion of a after 24 hours to prevent stale games from accumulating indefinitely
export async function deleteOldGames() {
    const db = await openDB();
    try {
        await db.run('DELETE FROM games WHERE played_at <= datetime("now", "-1 day")');
    } catch (error) {
        console.error('Error deleting old games:', error);
    } finally {
        await db.close();
    }
}


// Initialize the database and create tables if they don't exist
export async function initDB() {
    const db = await openDB();
    try {
        console.log('Setting up database...');

        // Create games table
        await db.exec(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner_id TEXT,
        word TEXT NOT NULL,
        game_id TEXT NOT NULL,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Create users table
        await db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        wins INTEGER DEFAULT 0
    )`);

        // Create chats table
        await db.exec(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        message TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(game_id)
    )`);

        const chatColumns = await db.all('PRAGMA table_info(chats)');
        const hasUserNameColumn = chatColumns.some((column: { name: string }) => column.name === 'user_name');
        if (!hasUserNameColumn) {
            await db.exec('ALTER TABLE chats ADD COLUMN user_name TEXT');
        }

        console.log('Database setup complete.');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await db.close();
    }
}