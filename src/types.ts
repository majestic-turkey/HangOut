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
    wrongLetters: Set<string>;
};


export interface GameSession {
    id: string;
    manager: GameState;
    players: Set<string>;
    createdAt: number;
}