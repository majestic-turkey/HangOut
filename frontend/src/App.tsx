import React from 'react'
import './App.css'
import { socket } from './socket'
import type { GameState } from './types.ts'
import TitleScreen from './components/TitleScreen'
import GameBoard from './components/GameBoard'

function App(): React.ReactElement {
  // Use state to manage the game state
  const [gameState, setGameState] = React.useState<GameState | null>(null)

  // Game state logging
  React.useEffect(() => {
    console.log('gameState changed:', gameState)
  }, [gameState]);

  // Server connection handler
  React.useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server')
    })
    return () => {
      socket.off('connect');
    };
  }, []);


  // Masked word handler (also handles guesses)
  React.useEffect(() => {
    const handleMaskedWord = (payload: { gameState?: GameState; maskedWord?: string; attemptsLeft?: number }) => {
      if (payload?.gameState) {

        // Rehydrate sets from arrays if necessary
        const toSet = (array: unknown): Set<string> => {
          if (array instanceof Set) return array
          if (Array.isArray(array)) {
            return new Set(array.filter((x): x is string => typeof x === 'string'))
          }
          return new Set()
        }

        // Update the entire game state if provided, otherwise just update the masked word and attempts left
        setGameState({
          ...payload.gameState,
          guessedLetters: toSet(payload.gameState.guessedLetters),
          wrongLetters: toSet(payload.gameState.wrongLetters)
        })
        return
      }

      setGameState((prev) => {
        if (!prev || !payload?.maskedWord) return prev
        return {
          ...prev,
          maskedWord: payload.maskedWord,
          attemptsLeft: payload.attemptsLeft ?? prev.attemptsLeft
        }
      })
    }

    socket.on('masked_word', handleMaskedWord)

    return () => {
      socket.off('masked_word', handleMaskedWord)
      }
  }, [])

  return (<>
    <h1>Hang Out!</h1>
    <div className="game-container">
      {gameState === null && <TitleScreen />}
      {gameState && <GameBoard state={gameState} />}
      {gameState?.gameId ? <p>Game ID: {gameState.gameId}</p> : null}
    </div>
  </>)
}

export default App
