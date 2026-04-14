/**
 * Database access functions for user management
 */

import DataBase from './db.ts';

// Get the win count for a user by username
export async function getPlayerWins(userName: string): Promise<number> {
    try {
        const row = await DataBase.get<{ wins: number }>('SELECT wins FROM users WHERE username = ?', [userName]);
        return row?.wins ?? 0;
    } catch (error) {
        console.error('Error fetching player wins:', error);
        return 0;
    }
}

// Look up a user by username, creating them if they don't exist
export async function findOrCreateUser(userName: string): Promise<{ id: number; username: string; wins: number }> {
    try {
        let row = await DataBase.get<{ id: number; username: string; wins: number }>('SELECT id, username, wins FROM users WHERE username = ?', [userName]);
        if (!row) {
            const result = await DataBase.run('INSERT INTO users (username) VALUES (?)', [userName]);
            row = { id: result.lastID || 0, username: userName, wins: 0 };
        }
        return row || { id: 0, username: userName, wins: 0 };
    } catch (error) {
        console.error('Error finding or creating user:', error);
        throw error;
    }
}

// Increment a user's win count by username
export async function incrementPlayerWins(userName: string) {
    try {
        await DataBase.run('UPDATE users SET wins = wins + 1 WHERE username = ?', [userName]);
    } catch (error) {
        console.error('Error incrementing player wins:', error);
    }
}