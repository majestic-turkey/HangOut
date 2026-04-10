import { socket } from '../socket'

export default function TitleScreen() {
  return (
    <div className="title-screen">
      <button className="start-button" onClick={() => socket.emit('new_game')}>Start Game</button>
    </div>
  )
}