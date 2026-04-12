import Confetti from 'react-confetti'
import type { GameState } from '../types.ts'
import Keyboard from './Keyboard'
import Chat from './Chat'

export default function GameBoard({ state }: { state: GameState }) {
    
    return (
        <div>
            {state.gameWon && <Confetti wind={0.02} />}
            <p>Word: {state.attemptsLeft <= 0 || state.gameWon ? state.word : state.maskedWord}</p>
            <p>Attempts left: {state.attemptsLeft}</p>
            <Keyboard state={state} />
            <Chat />
        </div>
    )
}