import React from 'react'
import { socket } from '../socket'

export default function Chat () {
    const [chatInput, setChatInput] = React.useState('');

    React.useEffect(() => {
        const handleChatMessage = (message: string) => {
            socket.emit('chat_message', message);
        }

        socket.on('chat_message', handleChatMessage);
        return () => {
            socket.off('chat_message', handleChatMessage);
        }
    }, []);


    function sendChat() {
        const message = chatInput.trim();
        if (!message) return;
        socket.emit('chat_message', message);
        setChatInput('');
    }

    return (<>
        <div className="chat">
            <p>Chat component coming soon!</p>
        </div>
        <input id="chat-input" type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled /><button onClick={() => sendChat()} disabled>Send</button>
    </>)
}