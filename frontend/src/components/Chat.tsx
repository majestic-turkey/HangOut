import React from 'react'
import { socket } from '../socket'
import type { ChatMessage, ConnectedPlayer } from '../types'

export default function Chat() {
    const [chatInput, setChatInput] = React.useState('');
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
    const [connectedPlayers, setConnectedPlayers] = React.useState<ConnectedPlayer[]>([]);

    // Chat message listener
    React.useEffect(() => {
        const handleChatMessage = (data: ChatMessage | ChatMessage[]) => {
            if (Array.isArray(data)) {
                setChatMessages(data);
                return;
            }

            console.log(`Chat message from ${data.userName}: ${data.message}`);
            setChatMessages((prev) => [...prev, data]);
        }

        socket.on('incoming_message', handleChatMessage);
        socket.emit('get_chat_history');

        const handlePlayerList = (players: ConnectedPlayer[]) => {
            setConnectedPlayers(players);
        };

        socket.on('player_list', handlePlayerList);
        socket.emit('get_player_list');

        return () => {
            socket.off('incoming_message', handleChatMessage);
            socket.off('player_list', handlePlayerList);
        }
    }, []);

    function sendChat() {
        const message = chatInput.trim();
        if (!message) return;
        socket.emit('sent_message', message);
        setChatInput('');
    }

    return (<>
        <div className="chat-container">
            <div className="chat">
                {chatMessages.map((msg, index) => (
                    <p key={index} className="chat-message"><strong>{msg.userName}:</strong> {msg.message}</p>
                ))}
            </div>
            <div className="player-list">
                <h3>Players:</h3>
                <ul>
                    {connectedPlayers.map((player) => (
                        <li key={player.socketId}>{player.userName}</li>
                    ))}
                </ul>
            </div>
        </div>
        <form className="chat-form" onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
            <input
                className="chat-input"
                id="chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            />
            <button className="chat-send" type="submit">Send</button>
        </form>
    </>)
}