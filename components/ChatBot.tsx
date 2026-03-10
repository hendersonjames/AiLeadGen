import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToChat, startChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import { PaperAirplaneIcon, UserIcon, SparklesIcon } from './common/Icons';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startChat();
    setMessages([{ sender: 'bot', text: "Hello! How can I help you manage your home services business today?" }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessageToChat(userMessage.text);
      const botMessage: ChatMessage = { sender: 'bot', text: response.text };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">AI Assistant Chat</h2>
      <p className="text-content-200 mb-6">Ask questions, get advice, or brainstorm ideas for your business.</p>
      
      <div className="bg-base-100 h-[60vh] flex flex-col rounded-lg border border-base-300">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-base-300 text-content-100'}`}>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>
               {msg.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-content-100" />
                </div>
              )}
            </div>
          ))}
          {loading && (
             <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-md p-3 rounded-lg bg-base-300 text-content-100">
                    <LoadingSpinner />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-base-300">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="w-full bg-base-300 border-transparent text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-lg transition-colors disabled:bg-base-300 disabled:text-content-200"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
