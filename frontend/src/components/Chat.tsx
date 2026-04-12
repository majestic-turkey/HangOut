import React from 'react'
import { socket } from '../socket'
import type { ChatMessage } from '../types'

export default function Chat () {
    const [chatInput, setChatInput] = React.useState('');
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);

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