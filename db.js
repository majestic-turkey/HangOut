/** 
 * Database setup
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function openDB () {
    return open({
        filename: './hangman.db',
        driver: sqlite3.Database
    });
}

try {
    console.log('Setting up database...');
    const db = await openDB();

    // Create games table
    await db.exec(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner_id INTEGER,
        word TEXT NOT NULL,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (winner_id) REFERENCES users(id)
    )`);

    // Create users table
    await db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        wins INTEGER DEFAULT 0
    )`);
    console.log('Database setup complete.');
} catch (error) {
    console.error('Error setting up database:', error);
}