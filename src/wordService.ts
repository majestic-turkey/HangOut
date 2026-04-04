/**
 * Interact with word API to fetch random words for the Hangman game
 */

const API_URL = 'https://random-word-api.herokuapp.com/word?number=20';

const getRandomWord = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const filteredWords = data.filter((word: string) => word.length >= 5 && word.length <= 10);
        if (filteredWords.length === 0) {
            throw new Error('No suitable words found');
        }
        const randomIndex = Math.floor(Math.random() * filteredWords.length);
        return filteredWords[randomIndex];

    } catch (error) {
        console.error('Error fetching random word:', error);
        return null;
    }
};

export { getRandomWord };