import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { RiRobot2Fill } from "react-icons/ri";
import { FaUser } from "react-icons/fa6";
import { BsSendFill } from "react-icons/bs";
import { FaSpinner } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const legalAdvisorPrompt = `
        You are a legal advisor AI. Your purpose is to provide general legal information and guidance, not to offer legal advice. You could ask for the place of incident, if something happened, then provide information or steps, one should immediately take to get out of a problem. You could list documents if asked by the user or should suggest by yourself, needed in the process. You could also prepare formats or templates for letters or applications regarding emergencies. Try to provide nearest offices or helplines if possible, by asking location of incident or if the user provided it. You are only providing information related to Indian laws and rules. Try to answer in the language the user is asking in.
        The user's query is: "${input}".
        Based on this query, provide a concise and helpful response, acting as a legal assistant. But don't give too much information at once, try asking him in the end by suggesting some queries the user could ask.

        Example of a good response format:

        [Your legal information here in the same language as the user's query]
      `;

      const chatHistory = [{ role: "user", parts: [{ text: legalAdvisorPrompt }] }];

      const payload = {
        contents: chatHistory,
      };


      const apiKey = import.meta.env.VITE_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const legalAdvice = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'I am sorry, I could not generate a response at this time. Please try again later.';

      const aiMessage = { role: 'assistant', content: legalAdvice };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error('Error fetching from API:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I encountered an error. Please check your network connection and try again.'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="header">
        <h1 className="header-title">Legal Advisor Agent</h1>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <RiRobot2Fill size={72} color="#385F71" style={{ marginBottom: '12px' }} />
            <p className="empty-state-text">Please ask your legal-related queries here.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-row ${msg.role === 'user' ? 'message-row-user' : 'message-row-assistant'}`}
          >
            {msg.role === 'assistant' && (
              <div className="avatar avatar-bot">
                <RiRobot2Fill size={18} />
              </div>
            )}

            <div className={`message-bubble ${msg.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="avatar avatar-user">
                <FaUser size={18} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="loading-message">
            <div className="avatar avatar-bot">
              <RiRobot2Fill size={18} />
            </div>
            <div className="loading-bubble">
              <FaSpinner size={24} color="#6b7280" className="loading-spinner" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a legal question..."
          className="textarea"
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className={`send-button ${isLoading ? 'send-button-disabled' : 'send-button-enabled'}`}
        >
          <BsSendFill size={20} color='#385F71' />
        </button>
      </div>
    </div>
  );
};

export default App;