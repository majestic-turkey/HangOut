/**
 * Database access functions for user management
 */

import DataBase from './db.ts';
import bcrypt from 'bcrypt';

type UserRecord = {
    id: number;
    username: string;
    wins: number;
};

type StoredUserRecord = UserRecord & {
    password_hash: string;
};

const SALT_ROUNDS = 10;

function normalizeCredential(value: string) {
    return value.trim();
}

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

// Create a new user with password hashing
export async function createUser(username: string, password: string): Promise<UserRecord> {
    try {
        const normalizedUserName = normalizeCredential(username);
        const normalizedPassword = normalizeCredential(password);
        if (!normalizedUserName || !normalizedPassword) {
            throw new Error('Username and password are required');
        }

        const hashedPassword = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);
        
        const result = await DataBase.run(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [normalizedUserName, hashedPassword]
        );

        if (typeof result.lastID !== 'number') {
            throw new Error('Failed to create user: insert did not return a valid user ID');
        }
        
        return {
            id: result.lastID,
            username: normalizedUserName,
            wins: 0
        };
    } catch (error) {
        if (error instanceof Error && /unique/i.test(error.message)) {
            throw new Error('Username already exists');
        }
        console.error('Error creating user:', error);
        throw error;
    }
}

// Verify user credentials for login
export async function verifyPassword(username: string, password: string): Promise<UserRecord | null> {
    try {
        const normalizedUserName = normalizeCredential(username);
        const normalizedPassword = normalizeCredential(password);
        if (!normalizedUserName || !normalizedPassword) {
            return null;
        }

        const row = await DataBase.get<StoredUserRecord>(
            'SELECT id, username, wins, password_hash FROM users WHERE username = ?',
            [normalizedUserName]
        );
        
        if (!row) {
            return null;
        }
        
        const passwordMatches = await bcrypt.compare(normalizedPassword, row.password_hash);
        if (!passwordMatches) {
            return null;
        }
        
        return {
            id: row.id,
            username: row.username,
            wins: row.wins
        };
    } catch (error) {
        console.error('Error verifying password:', error);
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