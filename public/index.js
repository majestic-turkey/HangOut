const socket = io();

document.addEventListener('keydown', (event) => {
    const key = event.key;
    socket.emit('keypress', key);
});

const output = document.getElementById('output');
const hiddenWord = document.getElementById('hiddenword');

let word;
let maskedWord = [];

socket.on('keypress', ({ id, key }) => {
    console.log(`User ${id} pressed key: ${key}`);

    // Validate key input (allow letters, numbers, and common punctuation)
    if (/^[\w\s\!\?\,\.\-\']$/.test(key)) {

        // Update masked word if the key is correct
        if (key.length === 1 && word.includes(key)) {
            for (let i = 0; i < word.length; i++) {
                if (word[i] === key) {
                    maskedWord[i] = key;
                }
            }
            hiddenWord.textContent = maskedWord.join(' ');
        }

        // Check if the word is fully guessed
        if (word === maskedWord.join('')) {
            alert('Congratulations! You guessed the word!');
            socket.emit('request_new_word');
        }
    }

});

// New word listener
socket.on('new_word', (newWord) => {
    word = newWord;
    console.log('New word received:', word);
    output.textContent = '';
    maskedWord = Array(word.length).fill('_');
    hiddenWord.textContent = maskedWord.join(' ');
});