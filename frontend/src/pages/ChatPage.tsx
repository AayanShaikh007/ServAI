import { useState, useEffect } from 'react'
import '../App.css'

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant. How can I help you today?',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [ipcAvailable, setIpcAvailable] = useState(false)

    useEffect(() => {
        // Check if IPC is available
        if (typeof window.ipcRenderer !== 'undefined') {
            setIpcAvailable(true)

            const removeListener = window.ipcRenderer.on('python-message', (...args) => {
                const message = args[0]

                if (typeof message === 'string' && message.trim().startsWith('{')) {
                    try {
                        const res = JSON.parse(message)

                        if (res.status === 'success' && res.type === 'chat' && res.message) {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: res.message,
                                timestamp: new Date()
                            }])
                            setIsLoading(false)
                        }
                    } catch (e) {
                        console.error('JSON parse error:', e)
                    }
                }
            })

            return () => {
                if (removeListener) removeListener()
            }
        }
    }, [])

    const handleSend = () => {
        if (!input.trim() || !ipcAvailable) return

        // Add user message
        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        // Send to backend
        window.ipcRenderer.send('to-python', {
            type: 'chat_message',
            message: input
        })
    }

    return (
        <div className="chat-page">
            <h1>AI Assistant</h1>

            <div className="chat-container">
                <div className="messages-container">
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.role}`}>
                            <div className="message-content">
                                {msg.content}
                            </div>
                            <div className="message-time">
                                {msg.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-content">
                                <span className="loading-spinner"></span>
                                Thinking...
                            </div>
                        </div>
                    )}
                </div>

                <div className="chat-input-container">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="chat-input"
                        disabled={!ipcAvailable || isLoading}
                    />
                    <button onClick={handleSend} disabled={!ipcAvailable || isLoading || !input.trim()}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatPage
