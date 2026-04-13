import Confetti from 'react-confetti'
import type { GameState } from '../types.ts'
import Keyboard from './Keyboard'
import Chat from './Chat'
import Word from './Word'
import WiltingFlower from './WiltingFlower'

export default function GameBoard({ state, flashLetter, flashPulseId }: { state: GameState; flashLetter: string | null; flashPulseId: number }) {
    
    return (
        <div className="game-board">
            {state.gameWon && <Confetti wind={0.02} />}
            <div className="game-status-row">
                <Word maskedWord={state.maskedWord} flashLetter={flashLetter} flashPulseId={flashPulseId} />
                <div className="flower-container">
                    <WiltingFlower attemptsLeft={state.attemptsLeft} maxAttempts={state.maxAttempts} />
                    <p className="attempts-display">Attempts left: <strong>{state.attemptsLeft}</strong></p>
                </div>
                <p className="wrong-letters">Wrong letters: {Array.from(state.wrongLetters).join(', ')}</p>
            </div>
            <Keyboard state={state} />
            <Chat />
        </div>
    )
}