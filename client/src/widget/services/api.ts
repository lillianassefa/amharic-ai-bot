import axios from 'axios';

// Helper to get script tag (works with Next.js)
const getScriptTag = (): HTMLScriptElement | null => {
  if (document.currentScript) {
    return document.currentScript as HTMLScriptElement;
  }
  
  // Fallback: find script by data attribute
  const scripts = document.querySelectorAll('script[data-api-key]');
  if (scripts.length > 0) {
    return scripts[scripts.length - 1] as HTMLScriptElement;
  }
  
  // Last resort: find any script with widget.js
  const allScripts = document.querySelectorAll('script[src*="widget.js"]');
  if (allScripts.length > 0) {
    return allScripts[allScripts.length - 1] as HTMLScriptElement;
  }
  
  return null;
};

// Get API base URL and key from script tag
const scriptTag = getScriptTag();
const scriptUrl = scriptTag?.src || '';
const API_BASE_URL = scriptUrl ? new URL(scriptUrl).origin : 'http://localhost:3001';
const API_KEY = scriptTag?.getAttribute('data-api-key') || '';

if (!API_KEY) {
  console.warn('Amharic AI Widget: No API key found. Make sure data-api-key attribute is set on the script tag.');
}

// Visitor ID persistence
const getVisitorId = () => {
  let id = localStorage.getItem('amharic_ai_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('amharic_ai_visitor_id', id);
  }
  return id;
};

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/widget`,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
});

export const getWidgetConfig = async () => {
  const res = await api.get('/config');
  return res.data.config;
};

export const startConversation = async (language = 'auto') => {
  const visitorId = getVisitorId();
  const res = await api.post('/conversations', { visitorId, language });
  return res.data;
};

export const sendMessage = async (conversationId: string, content: string, language?: string) => {
  const visitorId = getVisitorId();
  const res = await api.post(`/conversations/${conversationId}/messages`, {
    content,
    visitorId,
    language
  });
  return res.data;
};
