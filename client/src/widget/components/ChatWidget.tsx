import React, { useState, useEffect, useRef } from 'react';
import { getWidgetConfig, startConversation, sendMessage } from '../services/api';
import { MessageSquare, Send, X, Bot, Globe } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface WidgetConfig {
  primaryColor: string;
  welcomeMessage: string;
  welcomeMessageAm: string;
  botName: string;
  botNameAm: string;
  isEnabled: boolean;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initWidget = async () => {
      try {
        const configData = await getWidgetConfig();
        setConfig(configData);
      } catch (err) {
        console.error('Failed to load widget config:', err);
        // Use defaults if config fails
        setConfig({
          primaryColor: '#3B82F6',
          welcomeMessage: 'How can I help you today?',
          welcomeMessageAm: 'ዛሬ እንዴት ልረዳዎ እችላለሁ?',
          botName: 'AI Assistant',
          botNameAm: 'AI ረዳት',
          isEnabled: true
        });
      }
    };
    initWidget();
  }, []);

  useEffect(() => {
    if (isOpen && !conversationId) {
      const initConv = async () => {
        try {
          const data = await startConversation();
          setConversationId(data.conversationId);
          setMessages(data.messages || []);
        } catch (err) {
          console.error('Failed to start conversation:', err);
        }
      };
      initConv();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId || loading) return;

    const userContent = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const data = await sendMessage(conversationId, userContent);
      setMessages(prev => [...prev, data.userMessage, data.aiMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  if (config && !config.isEnabled) return null;

  const primaryColor = config?.primaryColor || '#3B82F6';
  const botName = language === 'am' ? (config?.botNameAm || 'AI ረዳት') : (config?.botName || 'AI Assistant');
  const welcomeMsg = language === 'am' ? (config?.welcomeMessageAm || 'ዛሬ እንዴት ልረዳዎ እችላለሁ?') : (config?.welcomeMessage || 'How can I help you today?');

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: primaryColor,
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '384px',
          maxWidth: 'calc(100vw - 40px)',
          height: '500px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            backgroundColor: primaryColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={24} />
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{botName}</h3>
                <p style={{ margin: 0, fontSize: '10px', opacity: 0.8 }}>Online</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                style={{
                  padding: '4px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'white'
                }}
                title="Switch Language"
              >
                <Globe size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '4px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <Bot size={24} color="#2563eb" />
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', padding: '0 16px' }}>
                  {welcomeMsg}
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  ...(msg.role === 'user' ? {
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderTopRightRadius: '4px'
                  } : {
                    backgroundColor: 'white',
                    color: '#1f2937',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #f3f4f6',
                    borderTopLeftRadius: '4px'
                  })
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '9999px',
              padding: '8px 16px'
            }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={language === 'am' ? 'መልእክት ይጻፉ...' : 'Type a message...'}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1f2937'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: (!inputValue.trim() || loading) ? 'not-allowed' : 'pointer',
                  opacity: (!inputValue.trim() || loading) ? 0.3 : 1,
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!(!inputValue.trim() || loading)) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Send size={20} />
              </button>
            </div>
            <p style={{
              fontSize: '8px',
              textAlign: 'center',
              marginTop: '8px',
              color: '#9ca3af'
            }}>
              Powered by Amharic AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
