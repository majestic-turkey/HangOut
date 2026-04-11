import { socket } from '../socket'

export default function TitleScreen() {
  const handleStartGame = () => {
    const wordLengthInput = document.getElementById('word-length') as HTMLInputElement;
    const wordLength = wordLengthInput?.value ? parseInt(wordLengthInput.value) : 6;
    const maxAttemptsInput = document.getElementById('max-attempts') as HTMLInputElement;
    const maxAttempts = maxAttemptsInput?.value ? parseInt(maxAttemptsInput.value) : 6;
    socket.emit('new_game', { wordLength }, maxAttempts);
  }

  return (
    <div className="title-screen">
      <input id="word-length" type="number" min="5" max="12" placeholder="Word Length (5-12)" />
      <input id="max-attempts" type="number" min="1" max="26" placeholder="Max Attempts (default 6)" />
      <button className="start-button" onClick={handleStartGame}>Start Game</button>
    </div>
  )
}