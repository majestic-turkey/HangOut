const socket = io();

document.addEventListener('keydown', (event) => {
    const key = event.key;
    socket.emit('keypress', key);
});

const output = document.getElementById('output');

socket.on('keypress', ({ id, key }) => {
    console.log(`User ${id} pressed key: ${key}`);
    if (/^[a-zA-Z\s]$/.test(key)) {
        output.textContent = output.textContent + `${key}`;
    }

});