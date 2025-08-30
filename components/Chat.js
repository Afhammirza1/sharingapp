import { useState, useEffect, useRef } from 'react';

export default function Chat({ socket, roomId, messages, setMessages }) {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate a random username with emojis
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const emojis = ['🦄', '🚀', '🌟', '🎨', '🔥', '💎', '🌈', '⚡'];
    const randomName = names[Math.floor(Math.random() * names.length)] + ' ' + emojis[Math.floor(Math.random() * emojis.length)];
    setUsername(randomName);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    const messageData = {
      text: message,
      sender: username,
      timestamp: new Date().toISOString(),
      roomId
    };

    socket.emit('send-message', messageData);
    setMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Start the conversation!</h3>
            <p className="text-sm opacity-75">Send a message to connect with others</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`message-bubble ${msg.sender === username ? 'message-sent' : 'message-received'}`}>
                {msg.sender !== username && (
                  <div className="text-xs font-semibold opacity-75 mb-1" style={{color: 'var(--primary-500)'}}>
                    {msg.sender}
                  </div>
                )}
                <div className="text-sm leading-relaxed">{msg.text}</div>
                <div className={`text-xs mt-1 opacity-60 ${msg.sender === username ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start animate-slide-up">
            <div className="typing-indicator">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <span className="text-xs ml-2">Someone is typing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        <form onSubmit={sendMessage}>
          <div className="chat-input-wrapper">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="chat-send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        
        {/* Chat Meta */}
        <div className="chat-meta">
          <div className="chat-user-info">
            <div className="status-dot status-online"></div>
            <span>You're {username}</span>
          </div>
          <div className="chat-shortcuts">
            <kbd className="kbd">Enter</kbd>
            <span>to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}