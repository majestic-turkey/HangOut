import { socket } from '../socket'

export default function TitleScreen() {
  const handleStartGame = () => {
    socket.emit('new_game')
  }

  return (
    <div className="title-screen">
      <button className="start-button" onClick={handleStartGame}>Start Game</button>
    </div>
  )
}