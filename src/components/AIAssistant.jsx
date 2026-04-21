import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { askAI } from '../gemini';
import './AIAssistant.css';

export default function AIAssistant({ tasks, userSettings, userId }) {
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
    });
    return () => unsubscribe();
  }, [userId]);

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
      
      const aggregatedContext = {
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

  const sanitizeUrl = (url) => {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Split into lines to handle lists and blocks
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let content = line;
      
      // Handle bold: **text** -> <b>text</b>
      content = content.replace(/\*\*(.*?)\*\*/g, (match, p1) => `<strong>${p1}</strong>`);
      
      // Handle markdown links: [text](url)
      content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, p1, p2) => 
        `<a href="${sanitizeUrl(p2)}" target="_blank" rel="noopener noreferrer" class="ai-link">${p1}</a>`
      );

      // Handle raw URLs (only if not already part of an <a> tag)
      content = content.replace(/(?<!=["'])(https?:\/\/[^\s<]+)/g, (match, p1) => 
        `<a href="${sanitizeUrl(p1)}" target="_blank" rel="noopener noreferrer" class="ai-link">${p1}</a>`
      );
      
      // Handle italic: *text* -> <i>text</i>
      content = content.replace(/\*(.*?)\*/g, (match, p1) => `<em>${p1}</em>`);

      // Handle bullet points: * or - at start
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().substring(2);
        // Apply replacements to bullet text too
        let formattedBullet = bulletText
          .replace(/\*\*(.*?)\*\*/g, (match, p1) => `<strong>${p1}</strong>`)
          .replace(/\[(.*?)\]\((.*?)\)/g, (match, p1, p2) => `<a href="${sanitizeUrl(p2)}" target="_blank" rel="noopener noreferrer" class="ai-link">${p1}</a>`)
          .replace(/(?<!=["'])(https?:\/\/[^\s<]+)/g, (match, p1) => `<a href="${sanitizeUrl(p1)}" target="_blank" rel="noopener noreferrer" class="ai-link">${p1}</a>`);
          
        return (
          <div key={i} className="flex gap-2 mb-1 pl-2">
            <span className="text-ai">•</span>
            <span dangerouslySetInnerHTML={{ __html: formattedBullet }} />
          </div>
        );
      }

      return (
        <p 
          key={i} 
          className={line.trim() === '' ? 'h-2' : 'mb-2'} 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      );
    });
  };

  return (
    <div className="ai-panel flex-col">
      <div className="ai-header">
        <div className="ai-header-content flex items-center gap-3">
          <Sparkles size={28} className="text-ai" />
          <h1>AI Assistant</h1>
        </div>
      </div>

      {/* Context Selector (Top) */}
      <div className="ai-context-selector">
        <p className="text-[10px] font-black uppercase text-muted tracking-[0.2em]">Contextual Workspace Memory</p>
        <div className="hub-selection-grid">
          {availableWorkspaces.map(ws => (
            <button 
              key={ws.id}
              onClick={() => toggleContext(ws.id)}
              className={`hub-chip ${selectedContextIds.includes(ws.id) ? 'selected' : ''}`}
              title={`Context: ${ws.name}`}
            >
              <div className="hub-indicator" style={{ backgroundColor: ws.color }}></div>
              <span>{ws.name}</span>
            </button>
          ))}
          {availableWorkspaces.length === 0 && <p className="text-[10px] italic py-2">No hubs detected.</p>}
        </div>
      </div>

      <div className="chat-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message flex gap-3 ${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="avatar"><Bot size={18} /></div>
            )}
            <div className="message-bubble text-sm">
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message flex gap-3 ai">
            <div className="avatar"><Loader2 className="rotating" size={18} /></div>
            <div className="message-bubble text-sm italic opacity-50">
              Processing system context...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSend} className="chat-input-wrapper">
          <input 
            type="text" 
            placeholder="Ask anything about your workspaces, tasks, or insights..." 
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={isTyping}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
