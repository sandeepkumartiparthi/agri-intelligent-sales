import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const AIAgent = ({ marketData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'IRSA Assistant active. How can I help you analyze the market today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Send the prompt AND the current marketData prop
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentInput, 
          data: marketData // This ensures the backend gets the latest list
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiReply = '';
      
      setIsTyping(false);
      // Create empty message for streaming
      setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiReply += decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = aiReply;
          return newMsgs;
        });
      }
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'ai', text: "Service busy. Please check connection." }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99999 }}>
      {isOpen ? (
        <div className="glass-slab" style={{ width: '320px', height: '400px', display: 'flex', flexDirection: 'column', padding: '15px', background: '#0f172a', border: '1px solid #34d399' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ color: '#34d399', margin: 0 }}>IRSA AI Agent</h4>
            <X size={20} onClick={() => setIsOpen(false)} style={{cursor:'pointer', color: '#fff'}} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: '8px', fontSize: '12px', background: m.sender === 'user' ? '#06b6d4' : '#1e293b', color: '#fff', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.text}
              </div>
            ))}
            {isTyping && <div style={{ fontSize: '12px', color: '#34d399', fontStyle: 'italic' }}>AI is analyzing data...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input className="glass-input" style={{ flex: 1, padding: '8px' }} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about Paddy, Wheat..." />
            <button onClick={handleSend} className="primary-action-btn"><Send size={15} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} style={{ borderRadius: '50%', width: '60px', height: '60px', background: '#34d399', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(52, 211, 153, 0.5)' }}>
          <MessageCircle size={30} color="#0f172a" />
        </button>
      )}
    </div>
  );
};
export default AIAgent;
