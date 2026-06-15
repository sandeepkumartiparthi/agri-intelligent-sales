import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'IRSA Assistant active. How can I help you analyze the market today?' }]);
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
      const response = await axios.post('/api/ai-chat', { prompt: currentInput });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm having trouble connecting to the data nodes. Please try again." }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {isOpen ? (
        <div className="glass-slab" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '15px', border: '1px solid #34d399' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ color: '#34d399' }}>IRSA AI Agent</h4>
            <X size={20} onClick={() => setIsOpen(false)} style={{cursor:'pointer', color: '#fff'}} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: '8px', fontSize: '12px', background: m.sender === 'user' ? '#06b6d4' : '#1e293b', color: '#fff', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input className="glass-input" style={{ flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} className="primary-action-btn"><Send size={15} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="primary-action-btn" style={{ borderRadius: '50%', width: '60px', height: '60px', boxShadow: '0 0 20px rgba(52, 211, 153, 0.5)' }}>
          <MessageCircle />
        </button>
      )}
    </div>
  );
};

export default AIAgent;
