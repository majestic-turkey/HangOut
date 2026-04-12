import React from 'react'
import { socket } from '../socket'

export default function Chat () {
    const [chatInput, setChatInput] = React.useState('');
    const [chatMessages, setChatMessages] = React.useState<{ socketId: string, userName: string, message: string }[]>([]);

    // Chat message sending
    React.useEffect(() => {
        const handleChatMessage = (message: string) => {
            socket.emit('sent_message', message);
        }

        socket.on('sent_message', handleChatMessage);
        return () => {
            socket.off('sent_message', handleChatMessage);
        }
    }, []);

    // Chat message listener
    React.useEffect(() => {
        const handleChatMessage = (data: { socketId: string, userName: string, message: string }) => {
            console.log(`Chat message from ${data.userName}: ${data.message}`);
            setChatMessages((prev) => [...prev, data]);
        }

        socket.on('incoming_message', handleChatMessage);
        return () => {
            socket.off('incoming_message', handleChatMessage);
        }
    }, []);

    function sendChat() {
        const message = chatInput.trim();
        if (!message) return;
        socket.emit('sent_message', message);
        setChatInput('');
    }

    return (<>
        <div className="chat">
            {chatMessages.map((msg, index) => (
                <p key={index} className="chat-message"><strong>{msg.userName}:</strong> {msg.message}</p>
            ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
            <input id="chat-input" type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
            <button type="submit">Send</button>
        </form>
    </>)
}