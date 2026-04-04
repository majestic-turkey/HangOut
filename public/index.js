const socket = io();

document.addEventListener('keydown', (event) => {
    const key = event.key;
    socket.emit('keypress', key);
});

const output = document.getElementById('output');
const hiddenWord = document.getElementById('hiddenword');

