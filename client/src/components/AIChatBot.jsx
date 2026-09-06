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
      width: '380px', height: '550px', backgroundColor: '#ffffff', 
      borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', 
      display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden',
      border: '1px solid #eaeaea'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#1a1a2e', color: 'white', padding: '16px 20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>ShipNest AI Assistant</h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', opacity: 0.8 }}
        >
          ×
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#007bff' : '#ffffff',
            color: msg.role === 'user' ? 'white' : '#333333',
            padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px', maxWidth: '85%',
            fontSize: '14px', lineHeight: '1.5',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            wordWrap: 'break-word'
          }}>
            {msg.parts[0].text.split('\n').map((line, i) => (
              <span key={i}>{line}<br/></span>
            ))}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '16px 16px 16px 2px', fontSize: '14px', color: '#666', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <span style={{ fontStyle: 'italic' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '15px', borderTop: '1px solid #eee', backgroundColor: 'white' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type your message..." 
          style={{ flex: 1, padding: '12px 15px', border: '1px solid #ddd', borderRadius: '25px', marginRight: '10px', color: '#333', outline: 'none', fontSize: '14px' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{ 
          backgroundColor: '#007bff', color: 'white', border: 'none', 
          borderRadius: '25px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s'
        }}>
          Send
        </button>
      </form>
    </div>
  );
}
