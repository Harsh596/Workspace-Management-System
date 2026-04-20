import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { askAI } from '../gemini';
import './AIAssistant.css';

export default function AIAssistant({ isOpen, onClose, tasks, userSettings, userId }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: "Hello! I'm your AI Workspace Assistant. I can help summarize tasks, prioritize work, or fetch insights." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [selectedContextIds, setSelectedContextIds] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'workspaces'), 
      where('ownerId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ws = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAvailableWorkspaces(ws);
      // Default select none or all? Let's default to none specified, 
      // or the app's current context if we had one.
    });
    return () => unsubscribe();
  }, [userSettings]);

  const toggleContext = (id) => {
    setSelectedContextIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    try {
      const customKey = userSettings?.geminiApiKey || null;
      const modelName = userSettings?.preferredModel || "gemini-flash-latest";
      
      // Build Aggregated Context
      let aggregatedContext = {
        tasks: tasks.filter(t => selectedContextIds.length === 0 || selectedContextIds.includes(t.workspaceId)),
        workspaces: availableWorkspaces.filter(w => selectedContextIds.includes(w.id))
      };

      const responseText = await askAI(currentInput, aggregatedContext, customKey, modelName);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: responseText
      }]);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: `Error: ${err.message}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`ai-panel flex-col ${isOpen ? 'open' : ''}`}>
      <div className="ai-header flex justify-between items-center">
        <div className="flex items-center gap-2 text-ai">
          <Sparkles size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Neural Interface</span>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={18} /></button>
      </div>

      {/* Context Selector */}
      <div className="ai-context-selector p-4 border-b border-color bg-surface-container-low">
        <p className="text-[9px] font-black uppercase text-muted mb-2 tracking-widest">Contextual Memory Access</p>
        <div className="flex flex-wrap gap-2">
          {availableWorkspaces.map(ws => (
            <button 
              key={ws.id}
              onClick={() => toggleContext(ws.id)}
              className={`text-[9px] px-2 py-1 border transition-all flex items-center gap-2 ${selectedContextIds.includes(ws.id) ? 'bg-accent text-white border-accent' : 'bg-surface border-color text-muted'}`}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ws.color }}></div>
              {ws.name}
            </button>
          ))}
          {availableWorkspaces.length === 0 && <p className="text-[10px] italic">No workspaces detected.</p>}
        </div>
      </div>

      <div className="chat-container flex-col gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`message flex gap-3 ${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="avatar ai-avatar"><Bot size={16} /></div>
            )}
            <div className="message-bubble text-sm" style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message flex gap-3 ai">
            <div className="avatar ai-avatar"><Bot size={16} /></div>
            <div className="message-bubble text-sm flex items-center">
       <Loader2 className="rotating text-ai" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSend} className="chat-input-wrapper">
          <input 
            type="text" 
            placeholder="Ask AI anything..." 
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="send-btn flex items-center justify-center" disabled={isTyping}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
