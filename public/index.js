const socket = io();

document.addEventListener('keydown', (event) => {
    const key = event.key;
    socket.emit('keypress', key);
});

const output = document.getElementById('output');
const hiddenWord = document.getElementById('hiddenword');
const newGameBtn = document.getElementById('newGameBtn');

newGameBtn.addEventListener('click', () => {
    socket.emit('new_game');
});

socket.on('masked_word', (data) => {
    if (hiddenWord) {
        hiddenWord.textContent = data.maskedWord;
    }
});