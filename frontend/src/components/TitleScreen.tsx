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
    const userNameInput = document.getElementById('user-name') as HTMLInputElement;
    const userName = userNameInput?.value ? userNameInput.value : 'Guest';

    if (gameId) {
      socket.emit('join_game', { gameId, userName }, (response?: { ok?: boolean; message?: string }) => {
        if (!response?.ok) {
          setStatusMessage(response?.message ?? 'Unable to join game')
          return
        }
        setStatusMessage('Joined game successfully')
      });
    } else {
      setStatusMessage(null)
      socket.emit('new_game', { wordLength, maxAttempts, userName }, (response?: { ok?: boolean; message?: string }) => {
        if (!response?.ok) {
          setStatusMessage(response?.message ?? 'Unable to start game')
          return
        }
        setStatusMessage('Game started successfully')
      });
    }
  }

  return (
    <div className="title-screen">
      <label htmlFor="user-name">Username:&#9;
      <input id="user-name" name="user-name" type="text" placeholder="Enter a username" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      </label>
      <label htmlFor="word-length">Word Length:&#9;
      <input id="word-length" name="word-length" type="number" min="5" max="12" placeholder="6" />
      </label>
      <label htmlFor="max-attempts">Max Attempts:&#9;
      <input id="max-attempts" name="max-attempts" type="number" min="1" max="26" placeholder="6" />
      </label>
      <label htmlFor="game-id">Game ID:&#9;
      <input
        id="game-id"
        name="game-id"
        type="text"
        placeholder="Join existing game"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      </label>

      <button className="start-button" onClick={handleStartGame}>Start Game</button>
      {statusMessage ? <p>{statusMessage}</p> : null}
    </div>
  )
}