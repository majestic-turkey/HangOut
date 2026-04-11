import React from 'react'
import Confetti from 'react-confetti'
import type { GameState } from '../types.ts'
import { socket } from '../socket'
import Keyboard from './Keyboard'

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
            <p>Word: {state.attemptsLeft <= 0 || state.gameWon ? state.word : state.maskedWord}</p>
            <p>Attempts left: {state.attemptsLeft}</p>
            <Keyboard state={state} />
        </div>
    )
}