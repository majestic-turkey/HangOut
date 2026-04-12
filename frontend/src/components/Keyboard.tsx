import React from 'react'
import type {KeyboardProps} from '../types.ts'
import { socket } from '../socket.ts'

export default function Keyboard({ state }: KeyboardProps) {
    const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
    const keys = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const isGameOver = state.gameWon || state.attemptsLeft <= 0;

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (document.activeElement?.id === 'chat-input') return
            if (!/^[a-z]$/i.test(event.key)) return
            console.log('Key pressed:', event.key)
            socket.emit('keypress', event.key)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

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
        <div key={row} id="keyboard" className="keyboard-row">
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
        <div className="keyboard">
            {keyEls}
        </div>
        {(isGameOver) && <button className="keyboard-action" onClick={handleContinueGame}>New Game</button>}
        {statusMessage ? <p className="keyboard-status">{statusMessage}</p> : null}
    </>);
}