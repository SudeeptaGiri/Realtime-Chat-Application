import { useEffect, useState } from "react"

function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  useEffect(() => {
    if (!isUsernameSet) return; // Don't connect until username is set

    console.log("Attempting to connect to WebSocket server...");
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connected to the server");
      // Send username to server when connected
      ws.send(JSON.stringify({ 
        type: 'join', 
        username: username,
        message: `${username} joined the chat`
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    ws.onclose = () => {
      console.log("Disconnected from server");
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'leave', 
          username: username,
          message: `${username} left the chat`
        }));
      }
      ws.close();
    };
  }, [isUsernameSet, username]);

  // Handle username submission
  function handleUsernameSubmit() {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      setIsUsernameSet(true);
    }
  }

  // Handle send message
  function handleSendMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log("Socket not connected");
      return;
    }

    if (!message.trim()) return;

    console.log("Sending message:", message);
    const messageData = {
      type: 'message',
      username: username,
      message: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    socket.send(JSON.stringify(messageData));
    setMessage("");
  }

  // Handle Enter key press
  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isUsernameSet) {
        handleUsernameSubmit();
      } else {
        handleSendMessage();
      }
    }
  }

  // Username entry screen
  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Welcome to Chitter-Chatter</h1>
            <p className="text-zinc-400 text-sm">Enter your name to start chatting</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              value={tempUsername}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent text-zinc-100 placeholder-zinc-500"
              autoFocus
            />
            <button 
              onClick={handleUsernameSubmit}
              disabled={!tempUsername.trim()}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Start chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-700 px-6 py-4 bg-zinc-900">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Chitter-Chatter</h1>
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            Chatting as {username}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {messages.map((msg, index) => {
            const isSystemMessage = msg.type === 'join' || msg.type === 'leave';
            const isOwnMessage = msg.username === username && msg.type === 'message';
            
            if (isSystemMessage) {
              return (
                <div key={index} className="flex justify-center">
                  <div className="bg-zinc-800 px-3 py-1 rounded-full text-sm text-zinc-400">
                    {msg.message}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center space-x-2 mb-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                      isOwnMessage 
                        ? 'bg-blue-600' 
                        : 'bg-orange-600'
                    }`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={`${isOwnMessage ? 'text-right' : ''}`}>
                      <span className="text-sm font-medium text-zinc-100">{msg.username}</span>
                      {msg.timestamp && (
                        <span className="text-xs text-zinc-500 ml-2">{msg.timestamp}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`${isOwnMessage ? 'ml-8' : 'ml-8'}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl max-w-full ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-700 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent resize-none text-zinc-100 placeholder-zinc-500"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App