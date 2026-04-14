/**
 * This module handles all database interactions related to chat messages
 */

import DataBase from './db.ts';

// Add a chat message
export async function addChatMessage(gameId: string, userId: string, userName: string, message: string) {
    try {
        await DataBase.run(
            'INSERT INTO chats (game_id, user_id, user_name, message, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [gameId, userId, userName, message]
        );
    } catch (error) {
        console.error('Error adding chat message:', error);
    } 
}

// Fetch chat messages for a specific game
export async function fetchChatMessages(gameId: string) {
    try {
        return await DataBase.all(
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
    }
}

// Clear a game's chat messages after the game ends
export async function clearChatMessages(gameId: string) {
    try {
        await DataBase.run('DELETE FROM chats WHERE game_id = ?', [gameId]);
    } catch (error) {
        console.error('Error clearing chat messages:', error);
    }
}