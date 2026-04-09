const socket = io();


const output = document.getElementById('output');
const hiddenWord = document.getElementById('hiddenword');
const newGameBtn = document.getElementById('newGameBtn');

newGameBtn.addEventListener('click', () => {
    socket.emit('new_game');
});

document.addEventListener('keydown', (event) => {
    newGameBtn.disabled = true;
    const key = event.key;
    socket.emit('keypress', key);
    setTimeout(() => {
        newGameBtn.disabled = false;
    }, 3000); // Game is rate-limited to one guess every 3 seconds
});

socket.on('masked_word', (data) => {
    if (hiddenWord) {
        hiddenWord.textContent = data.maskedWord;
    }
});