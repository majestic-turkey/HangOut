const socket = io();


const output = document.getElementById('output');
const hiddenWord = document.getElementById('hiddenword');
const newGameBtn = document.getElementById('newGameBtn');

newGameBtn.addEventListener('click', () => {
    socket.emit('new_game');
});

document.addEventListener('keydown', (event) => {
    if (event.repeat) return; // Ignore repeated key presses
    if (event.key.length !== 1 || !/[a-zA-Z]/.test(event.key)) return; // Only process single alphabetic characters

    newGameBtn.disabled = true;
    const key = event.key;
    socket.emit('keypress', key);
    setTimeout(() => {
        newGameBtn.disabled = false;
    }, 2000); // Game is rate-limited to one guess every 2 seconds
});

socket.on('masked_word', (data) => {
    if (hiddenWord) {
        hiddenWord.textContent = data.maskedWord;
    }
});