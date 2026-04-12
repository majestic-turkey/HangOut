import Confetti from 'react-confetti'
import type { GameState } from '../types.ts'
import Keyboard from './Keyboard'
import Chat from './Chat'
import Word from './Word'

export default function GameBoard({ state, flashLetter, flashPulseId }: { state: GameState; flashLetter: string | null; flashPulseId: number }) {
    
    return (
        <div className="game-board">
            {state.gameWon && <Confetti wind={0.02} />}
            <div className="game-status-row">
                <Word maskedWord={state.maskedWord} flashLetter={flashLetter} flashPulseId={flashPulseId} />
                <p className="attempts-display">Attempts left: <strong>{state.attemptsLeft}</strong></p>
            </div>
            <Keyboard state={state} />
            <Chat />
        </div>
    )
}