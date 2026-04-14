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

export interface SaveStateProps {
    playerName?: string;
    gameId: string;
    winnerId?: string;
    word: string;
    gameWon: boolean;
    game?: GameState;
}