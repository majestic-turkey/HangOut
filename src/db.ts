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
export async function createGame(word: string, gameId: string) {
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



// Save the current game state to the database
export async function saveGameState(gameState: GameState) {
    const db = await openDB();
    try {
        if (gameState.gameWon) {
            await db.run('UPDATE games SET winner_id = ?, word = ? WHERE game_id = ?', [gameState.winnerId, gameState.word, gameState.gameId]);
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
    `);

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
    `);

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