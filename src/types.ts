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
};


export interface GameSession {
    id: string;
    manager: GameState;
    players: Set<string>;
    createdAt: number;
}