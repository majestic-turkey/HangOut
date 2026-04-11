import React from 'react'
import Confetti from 'react-confetti'
import type { GameState } from '../types.ts'
import { socket } from '../socket'

export default function GameBoard({ state }: { state: GameState }) {
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!/^[a-z]$/i.test(event.key)) return
            console.log('Key pressed:', event.key)
            socket.emit('keypress', event.key)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])


    return (
        <div>
            {state.gameWon && <Confetti wind={0.02} />}
            <p>Word: {state.maskedWord}</p>
            <p>Attempts left: {state.attemptsLeft}</p>
            {/* TODO: Display keyboard component for mobile devices
            <Keyboard guessedLetters={state.guessedLetters} />
            Keyboard should display letters still available to guess, as well as fade guessed letters - gray if not in the word, green if in the word
             */}
        </div>
    )
}