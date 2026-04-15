/** 
 * Database setup
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { getPlayerWins, createUser, verifyPassword, incrementPlayerWins } from './users.ts';
import { clearChatMessages, fetchChatMessages, addChatMessage } from './chat.ts';
import { createGame, saveGameState, deleteOldGames } from './game.ts';

async function openDB() {
    return open({
        filename: './hangman.db',
        driver: sqlite3.Database
    });
}


// Default export is the database connection instance that can be imported and used throughout the application
const DataBase = await openDB();
export default DataBase;

// Re-export database functions for easier imports in other modules
export {
    getPlayerWins,
    createUser,
    verifyPassword,
    incrementPlayerWins,
    clearChatMessages,
    fetchChatMessages,
    addChatMessage,
    createGame,
    saveGameState,
    deleteOldGames
}

// Initialize the database and create tables if they don't exist
export async function initDB() {
    try {
        console.log('Setting up database...');

        // Create games table
        await DataBase.exec(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner_id TEXT,
        word TEXT NOT NULL,
        game_id TEXT NOT NULL,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Create users table
        await DataBase.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        wins INTEGER DEFAULT 0
    )`);

        // Create chats table
        await DataBase.exec(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        message TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(game_id)
    )`);

        const chatColumns = await DataBase.all('PRAGMA table_info(chats)');
        const hasUserNameColumn = chatColumns.some((column: { name: string }) => column.name === 'user_name');
        if (!hasUserNameColumn) {
            await DataBase.exec('ALTER TABLE chats ADD COLUMN user_name TEXT');
        }

        console.log('Database setup complete.');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}