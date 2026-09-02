import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AIChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: "Hi! I'm your AI support agent. I can answer policy questions or look up your tracking number." }] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userText }] }]);
    setLoading(true);

    try {
      // Send message along with the entire history
      const res = await api.post('/ai/customer', { 
        message: userText, 
        history: messages.length > 1 ? messages.slice(1) : [] 
      });
      
      setMessages(prev => [
        ...prev, 
        { role: 'model', parts: [{ text: res.data.text }] }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { role: 'model', parts: [{ text: 'Sorry, I am having trouble connecting to the server.' }] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'customer') return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', 
          backgroundColor: '#007bff', color: 'white', border: 'none', 
          borderRadius: '50px', padding: '15px 25px', fontSize: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', zIndex: 1000
        }}
      >
        💬 Support AI
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', 
      width: '350px', height: '500px', backgroundColor: 'white', 
      borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', 
      display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#007bff', color: 'white', padding: '15px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Delhivery AI Assistant</h3>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
            color: msg.role === 'user' ? 'white' : 'black',
            padding: '10px', borderRadius: '15px', maxWidth: '80%',
            fontSize: '14px', lineHeight: '1.4',
            wordWrap: 'break-word'
          }}>
            {msg.parts[0].text.split('\n').map((line, i) => (
              <span key={i}>{line}<br/></span>
            ))}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '15px', fontSize: '14px' }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #ddd', backgroundColor: 'white' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type your message..." 
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginRight: '10px', color: 'black' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{ 
          backgroundColor: '#007bff', color: 'white', border: 'none', 
          borderRadius: '5px', padding: '0 15px', cursor: 'pointer' 
        }}>
          Send
        </button>
      </form>
    </div>
  );
}
