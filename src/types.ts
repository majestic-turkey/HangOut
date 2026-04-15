export type AuthAction = 'guest' | 'login' | 'register';

export interface GameState {
    word: string;
    guessedLetters: Set<string>;
    maxAttempts: number;
    attempts: number;
    gameWon: boolean;
    winnerId?: string;
    gameId: string;
    getMaskedWord: () => string;
    guessLetter: (key: string) => string;
    startNewGame: (id: string, wordLength?: number) => void;
    wrongLetters: Set<string>;
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
    maxAttempts?: number;
    userName?: string;
    gameId?: string;
    password?: string;
    authAction?: AuthAction;
}

export interface Ack {
    ok: boolean;
    message: string;
}