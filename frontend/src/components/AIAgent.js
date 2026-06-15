import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';

const AIAgent = ({ marketData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'IRSA Assistant active. How can I help you analyze the market today?' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const response = await axios.post('/api/ai-chat', { prompt: currentInput, data: marketData });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm having trouble connecting to the data nodes." }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99999 }}>
      {isOpen ? (
        <div className="glass-slab" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '15px', border: '1px solid #34d399', background: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ color: '#34d399', margin: 0 }}>IRSA AI Agent</h4>
            <X size={20} onClick={() => setIsOpen(false)} style={{cursor:'pointer', color: '#fff'}} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: '8px', fontSize: '12px', background: m.sender === 'user' ? '#06b6d4' : '#1e293b', color: '#fff', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input className="glass-input" style={{ flex: 1, padding: '8px' }} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about crops..." />
            <button onClick={handleSend} className="primary-action-btn"><Send size={15} /></button>
          </div>
        </div>
      ) : (
        // 🌟 NEW: Vertical container for Label + Button
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#34d399', 
            background: 'rgba(52, 211, 153, 0.1)', 
            padding: '2px 8px', 
            borderRadius: '10px',
            whiteSpace: 'nowrap'
          }}>
            AI Help
          </span>
          <button 
            onClick={() => setIsOpen(true)} 
            style={{ 
              borderRadius: '50%', 
              width: '60px', 
              height: '60px', 
              boxShadow: '0 4px 20px rgba(52, 211, 153, 0.5)', 
              backgroundColor: '#34d399',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MessageCircle size={30} color="#0f172a" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAgent;
