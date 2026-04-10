import './App.css'
import { socket } from './socket'
import TitleScreen from './components/TitleScreen'

function App() {
  socket.on('connect', () => {
    console.log('Connected to server')
  })

  return (<>
    <h1>Hang Out!</h1>
    <div className="game-container">
      <TitleScreen />
    </div>
  </>)
}

export default App
