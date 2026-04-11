import { useState } from 'react'
import type {KeyboardProps} from '../types.ts'
import { socket } from '../socket.ts'

export default function Keyboard({ state }: KeyboardProps) {
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const keys = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const isGameOver = state.gameWon || state.attemptsLeft <= 0;

    const handleContinueGame = () => {
        socket.emit('continue_game', (response?: { ok?: boolean; message?: string }) => {
            if (!response?.ok) {
                setStatusMessage(response?.message ?? 'Unable to restart game')
                return
            }

            setStatusMessage('Game restarted for all players')
        })
    }

    // Render keyboard keys
    const keyEls = keys.map(row => {
        return (
        <div key={row}>
            {row.split('').map(key => {
                const isGuessed = state.guessedLetters.has(key);
                const isWrong = state.wrongLetters.has(key);
                return (
                    <button key={key} onClick={() => socket.emit('keypress', key)} disabled={isGuessed} className={`key ${isGuessed ? 'guessed-key' : ''} ${isWrong ? 'wrong-key' : ''}`}>
                        {key.toUpperCase()}
                    </button>
                );
            })}
        </div>
        );
    });

    return (<>
        <div>
            {keyEls}
        </div>
        {(isGameOver) && <button onClick={handleContinueGame}>New Game</button>}
        {statusMessage ? <p>{statusMessage}</p> : null}
    </>);
}