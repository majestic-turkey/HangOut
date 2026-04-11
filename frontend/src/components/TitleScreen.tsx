import { useState } from 'react'
import { socket } from '../socket'

export default function TitleScreen() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleStartGame = () => {
    const wordLengthInput = document.getElementById('word-length') as HTMLInputElement;
    const wordLength = wordLengthInput?.value ? parseInt(wordLengthInput.value) : 6;
    const gameIdInput = document.getElementById('game-id') as HTMLInputElement;
    const gameId = gameIdInput?.value ? gameIdInput.value : undefined;
    const maxAttemptsInput = document.getElementById('max-attempts') as HTMLInputElement;
    const maxAttempts = maxAttemptsInput?.value ? parseInt(maxAttemptsInput.value) : 6;

    // If a game ID is provided, attempt to join that game. Otherwise, start a new game with the specified word length and max attempts.
    if (gameId) {
      socket.emit('join_game', gameId, (response?: { ok?: boolean; message?: string }) => {
        if (!response?.ok) {
          setStatusMessage(response?.message ?? 'Unable to join game')
          return
        }
        setStatusMessage('Joined game successfully')
      });
    } else {
      setStatusMessage(null)
      socket.emit('new_game', { wordLength }, maxAttempts);
    }
  }

  return (
    <div className="title-screen">
      <input id="word-length" type="number" min="5" max="12" placeholder="Word Length (5-12)" />
      <input id="max-attempts" type="number" min="1" max="26" placeholder="Max Attempts (default 6)" />
      <input
        id="game-id"
        type="text"
        placeholder="Game ID (optional, for joining existing game)"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button className="start-button" onClick={handleStartGame}>Start Game</button>
      {statusMessage ? <p>{statusMessage}</p> : null}
    </div>
  )
}