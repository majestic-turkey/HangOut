import SocketIO from 'socket.io';

export interface GameState {
    word: string;
    guessedLetters: Set<string>;
    maxAttempts: number;
    attempts: number;
    gameWon: boolean;
    winnerId?: string;
    gameId: string;
    getMaskedWord: () => string;
    guessLetter: (key: string) => Promise<string>;
    startNewGame: (id: string, wordLength?: number) => Promise<void>;
    wrongLetters: Set<string>;
    reset: () => void;
    getPlayerName: (socketId: string) => string;
    addOrUpdatePlayer: (socketId: string, userName: string) => void;
    removePlayer: (socketId: string) => void;
    players: Set<Player>;
};


export interface GameSession {
    id: string;
    manager: GameState;
    players: Set<string>;
    createdAt: number;
}

export interface Player {
    socketId: string;
    userName: string;
}

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    wins: number;
}

export interface Payload {
    maskedWord: string;
    attemptsLeft: number;
    gameState: GameState;
    wordLength?: number;
    userName?: string;
    gameId?: string;
}

export interface Ack {
    ok: boolean;
    message: string;
}
