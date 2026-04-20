import React from 'react'
import './App.css'
import { socket } from './socket'
import type { GameState } from './types.ts'
import TitleScreen from './components/TitleScreen'
import GameBoard from './components/GameBoard'
import AuthModal from './components/AuthModal'

function App(): React.ReactElement {
  // Use state to manage the game state
  const [gameState, setGameState] = React.useState<GameState | null>(null)
  const [flashLetter, setFlashLetter] = React.useState<string | null>(null)
  const [flashPulseId, setFlashPulseId] = React.useState(0)
  const [connected, setConnected] = React.useState(false)
  const [showConnectionModal, setShowConnectionModal] = React.useState(false)
  const [userId, setUserId] = React.useState<number | null | undefined>(undefined)
  const [authAction, setAuthAction] = React.useState<'guest' | 'login' | 'register'>('login')

  // Game state logging
  React.useEffect(() => {
    console.log('gameState changed:', gameState)
  }, [gameState]);

  // Server connection handler
  React.useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
      setShowConnectionModal(true)
    })
    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnected(false)
      setShowConnectionModal(true)
    })
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Call GET /me on initial load to rehydrate session if available
  React.useEffect(() => {
    fetch('/me')
      .then((res) => res.json())
      .then((json) => {
        setUserId(json.userId ?? undefined);
      })
      .catch(() => setUserId(undefined));
  }, [])

  // Display the connection modal for 2 seconds, display whether we're connected or not
  React.useEffect(() => {
    if (!showConnectionModal) return

    const timer = window.setTimeout(() => {
      setShowConnectionModal(false)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [showConnectionModal])
  const connectionModal = (
    showConnectionModal && (
      <div className="connection-modal">
        <div className="connection-content">
          <p>{connected ? '🟢 Connected' : '🔴 Disconnected — "Reconnecting...'}</p>
        </div>
      </div>
    )
  );


  // Masked word handler (also handles guesses)
  React.useEffect(() => {
    const handleMaskedWord = (payload: { gameState?: GameState; maskedWord?: string; attemptsLeft?: number; newlyRevealedLetter?: string }) => {
      if (payload?.newlyRevealedLetter) {
        setFlashLetter(payload.newlyRevealedLetter.toLowerCase())
        setFlashPulseId((prev) => prev + 1)
      }

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

  React.useEffect(() => {
    if (!flashLetter) return

    const timer = window.setTimeout(() => {
      setFlashLetter(null)
    }, 420)

    return () => window.clearTimeout(timer)
  }, [flashLetter, flashPulseId])

  // Reveal word when game is over
  React.useEffect(() => {
    const handleGameOver = (payload: { word: string }) => {
      setGameState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          maskedWord: payload.word
        }
      })
    }

    socket.on('game_over', handleGameOver)

    return () => {
      socket.off('game_over', handleGameOver)
    }
  }, [])

  function handleLogout() {
    fetch('/logout', { method: 'POST' })
      .then((res) => res.json())
      .then(() => {
        setUserId(undefined);
        setAuthAction('login');
        setGameState(null);
      })
      .catch(() => {
        // Even if logout fails, clear the user ID on the client side to avoid confusion
        setUserId(undefined);
        setAuthAction('login');
      });
  }

  return (
    <div className="app-shell">
      {connectionModal}
      <h1 className="app-title">Hang Out!</h1>
      <div className="game-container">
        {userId === undefined && <AuthModal authAction={authAction} onSuccess={(id) => setUserId(id)} />}
        {gameState === null &&
         userId !== undefined &&
          <TitleScreen onGameInitiated={() => setShowConnectionModal(true)} />}
        {gameState && <GameBoard state={gameState} flashLetter={flashLetter} flashPulseId={flashPulseId} />}
        {gameState?.gameId ? <p className="game-id">Game ID: {gameState.gameId}</p> : null}
      </div>
      {userId !== undefined && <button className="logout-button" onClick={handleLogout}>Logout</button>}
    </div>
  )
}

export default App
