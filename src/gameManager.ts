/**
 * Manages game state and logic for the Hangman game
 */

import { getRandomWord } from './wordService.ts';
import type { GameState } from './types.ts';

export default class GameManager implements GameState {
    word: string;
    guessedLetters: Set<string>;
    maxAttempts: number;
    attempts: number;
    gameWon: boolean;
    winnerId?: string;
    gameId: string;

    constructor(maxAttempts: number = 6) {
        this.word = '';
        this.guessedLetters = new Set();
        this.maxAttempts = maxAttempts;
        this.attempts = 0;
        this.gameWon = false;
        this.winnerId = undefined;
        this.gameId = '';
    }

    // Start a new game by fetching a random word and resetting the game state
    async startNewGame(id: string): Promise<void> {
        const randomWord = await getRandomWord();
        if (randomWord) {
            this.word = randomWord.toLowerCase();
            this.guessedLetters.clear();
            this.attempts = 0;
            this.gameWon = false;
            this.winnerId = undefined;
            this.gameId = id;
        }
    }

    // Mask the word by replacing unguessed letters with underscores
    getMaskedWord(): string {
        return this.word.split('').map((char) => (this.guessedLetters.has(char) ? char : '_')).join(' ');
    }


    // Process a letter guess, update game state accordingly, and return whether the guess was valid
    guessLetter(letter: string): boolean {
        letter = letter.toLowerCase();
        if (this.guessedLetters.has(letter) || this.attempts >= this.maxAttempts) {
            return false;
        }
        this.guessedLetters.add(letter);
        if (!this.word.includes(letter)) {
            this.attempts++;
        }

        // Check if the game has been won
        this.gameWon = this.word.split('').every((char) => this.guessedLetters.has(char));

        return true;
    }
}