/**
 * Manages game state and logic for the Hangman game
 */

import { getRandomWord } from './wordService.ts';
import type { GameState, Player } from './types.ts';
import { saveGameState, createGame } from './db/db.ts';

export default class GameManager implements GameState {
    word: string;                   // The word to be guessed
    guessedLetters: Set<string>;    // Letters that have been guessed correctly
    maxAttempts: number;            // Maximum number of wrong attempts allowed
    attempts: number;               // Current number of wrong attempts
    gameWon: boolean;               // Flag indicating if the game has been won
    winnerId?: string;              // ID of the winner, if the game has been won
    gameId: string;                 // Unique identifier for the game session
    wrongLetters: Set<string>;      // Letters that have been guessed incorrectly
    players: Set<Player>;

    constructor(maxAttempts: number) {
        this.word = '';
        this.guessedLetters = new Set();
        this.wrongLetters = new Set();
        this.maxAttempts = maxAttempts;
        this.attempts = 0;
        this.gameWon = false;
        this.winnerId = undefined;
        this.gameId = '';
        this.players = new Set();
    }

    // Start a new game by fetching a random word and resetting the game state
    async startNewGame(id: string, wordLength?: number): Promise<void> {
        const randomWord = getRandomWord(wordLength);
        if (randomWord) {
            this.word = randomWord.toLowerCase();
            this.guessedLetters.clear();
            this.wrongLetters.clear();
            this.attempts = 0;
            this.gameWon = false;
            this.winnerId = undefined;
            this.gameId = id;
        }
        await createGame(this.word, this.gameId);
    }

    // Mask the word by replacing unguessed letters with underscores
    getMaskedWord(): string {
        return this.word.split('').map((char) => (this.guessedLetters.has(char) ? char : '_')).join(' ');
    }

    // Get the current game state
    getGameState(): GameState {
        return {
            ...this,
            maskedWord: this.getMaskedWord(),
            attemptsLeft: this.maxAttempts - this.attempts,
        } as GameState;
    }

    // Retrieve a player name
    getPlayerName(socketId: string): string {
        const player = Array.from(this.players).find((p) => p.socketId === socketId);
        return player ? player.userName : `Player-${this.gameId.substring(0, 4)}`;
    }

    // Keep one player record per socket and allow name updates on reconnect/rejoin.
    addOrUpdatePlayer(socketId: string, userName: string): void {
        const normalizedName = userName?.trim() || 'Guest';
        this.players = new Set(Array.from(this.players).filter((p) => p.socketId !== socketId));
        this.players.add({ socketId, userName: normalizedName });
    }

    removePlayer(socketId: string): void {
        this.players = new Set(Array.from(this.players).filter((p) => p.socketId !== socketId));
    }

    // Reset the game state to start a new game
    reset(): void {
        this.word = getRandomWord(this.word.length);
        this.guessedLetters.clear();
        this.wrongLetters.clear();
        this.attempts = 0;
        this.gameWon = false;
        this.winnerId = undefined;
        this.gameId += '-' + (Date.now() % 38); // Generate a new game ID by appending a timestamp
    }

    // Process a letter guess, update game state accordingly, and return whether the guess was valid
    async guessLetter(letter: string): Promise<string> {
        letter = letter.toLowerCase();
        if (this.guessedLetters.has(letter) || this.attempts >= this.maxAttempts) {
            return JSON.stringify({ accepted: false, message: "Invalid guess or game over" });
        }
        this.guessedLetters.add(letter);
        if (!this.word.includes(letter)) {
            this.wrongLetters.add(letter);
            this.attempts++;
        }

        // Check if the game has been won
        this.gameWon = this.word.split('').every((char) => this.guessedLetters.has(char));

        // Save game state and return the result of the guess
        await saveGameState(this);

        return JSON.stringify({
            accepted: true,
            correct: this.word.includes(letter),
            maskedWord: this.getMaskedWord(),
            attemptsLeft: this.maxAttempts - this.attempts,
            gameWon: this.gameWon,
            newlyRevealedLetter: this.word.includes(letter) ? letter : undefined,
         });
    }
}