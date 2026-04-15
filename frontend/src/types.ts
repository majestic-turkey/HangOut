export interface GameState {
    word: string;
    guessedLetters: Set<string>;
    wrongLetters: Set<string>;
    attempts: number;
    maxAttempts: number;
    gameWon: boolean;
    gameId: string;
    maskedWord: string;
    attemptsLeft: number;
}

export type AuthAction = 'guest' | 'login' | 'register';

export interface KeyboardProps {
    state: GameState;
}

export interface ChatMessage {
    socketId: string;
    userName: string;
    message: string;
}

export interface ConnectedPlayer {
    socketId: string;
    userName: string;
    wins?: number;
}