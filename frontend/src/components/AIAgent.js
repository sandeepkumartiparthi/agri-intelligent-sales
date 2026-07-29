import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, MessageSquare } from 'lucide-react';

export default function AIAgent({ marketData = [], advisorResult = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your IRSA Assistant. Ask me about mandi prices, climate risk, or marketplace tools.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);
  const isMountedRef = useRef(true);

  // Unmount protection to prevent setting state on unmounted components
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Smooth auto-scroll on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isTyping) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text: trimmedInput }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://agri-intelligent-sales.onrender.com/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedInput, data: marketData, advisor: advisorResult })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body returned from stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiReply = '';

      if (isMountedRef.current) {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'ai', text: '' }]);
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiReply += decoder.decode(value, { stream: true });

        if (isMountedRef.current) {
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                text: aiReply
              };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("AI Agent Streaming Error:", error);
      if (isMountedRef.current) {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          { sender: 'ai', text: 'Sorry, I encountered an issue retrieving real-time telemetry. Please try again.' }
        ]);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          <Bot size={18} />
          <span>IRSA AI Advisor</span>
        </button>
      )}

      {isOpen && (
        <div style={{
          width: '350px',
          height: '480px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
              <Bot size={18} />
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>IRSA AI Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? '#0284c7' : '#1e293b',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  maxWidth: '82%',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              >
                {msg.text}
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#1e293b', color: '#38bdf8', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                Analyzing market telemetry...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Row */}
          <div style={{ padding: '12px', backgroundColor: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask IRSA Assistant..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              style={{
                backgroundColor: '#06b6d4',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                padding: '0 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (isTyping || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
