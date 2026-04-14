import words from '../data/words.json' with { type: 'json' };

// const API_URL = 'https://random-words-api.kushcreates.com/api?language=en&length=7&type=lowercase&words=1';

const FALLBACK_WORDS = [
    'socket',
    'hangman',
    'program',
    'network',
    'puzzle',
    'victory',
    'browser',
    'lobby',
    'server',
    'letter'
];

const getRandomWord = (length = Math.ceil(Math.random() * 10)): string => { // Random word length for testing purposes
    const filteredWords = words.filter(word => word.length === length);
    if (filteredWords.length === 0) {
        console.warn(`No words of length ${length} found in local list. Using fallback words.`);
        const fallbackIndex = Math.floor(Math.random() * FALLBACK_WORDS.length);
        return FALLBACK_WORDS[fallbackIndex];
    }
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    return filteredWords[randomIndex];
}

/* const getRandomWord = async (): Promise<string> => {
    try {
        console.log('Fetching random word from API...');
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Word API request failed with status ${response.status}`);
        }
        const data = await response.json();
        const filteredWords = data.word;
        if (filteredWords.length === 0) {
            throw new Error('No suitable words found');
        }
        console.log('Random word fetched:', filteredWords);
        const randomIndex = Math.floor(Math.random() * filteredWords.length);
        return filteredWords[randomIndex];

    } catch (error) {
        console.error('Error fetching random word:', error);
        const fallbackIndex = Math.floor(Math.random() * FALLBACK_WORDS.length);
        return FALLBACK_WORDS[fallbackIndex];
    }
};
*/

export { getRandomWord };