import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './components/ChatWidget';

// Helper to get script tag (works with Next.js)
const getScriptTag = (): HTMLScriptElement | null => {
  // Try currentScript first
  if (document.currentScript) {
    return document.currentScript as HTMLScriptElement;
  }
  
  // Fallback: find script by ID or data attribute
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

// Initialize widget
const initWidget = () => {
  // CRITICAL: Wait for body to exist (Next.js issue)
  if (!document.body) {
    // Retry after a short delay
    setTimeout(initWidget, 50);
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
    return;
  }

  // Check if already initialized
  if (document.getElementById('amharic-ai-widget-container')) {
    console.log('Amharic AI Widget: Already initialized');
    return;
  }

  const scriptTag = getScriptTag();
  if (!scriptTag) {
    console.error('Amharic AI Widget: Could not find script tag');
    // Retry once more after a delay (script might load async)
    setTimeout(() => {
      const retryTag = getScriptTag();
      if (!retryTag) {
        console.error('Amharic AI Widget: Script tag still not found after retry');
      } else {
        initWidget();
      }
    }, 100);
    return;
  }

  try {
    // Create container
    const container = document.createElement('div');
    container.id = 'amharic-ai-widget-container';
    container.setAttribute('data-widget', 'amharic-ai');
    document.body.appendChild(container);
    console.log('Amharic AI Widget: Container created');

    // Use Shadow DOM to isolate styles
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Create mount point
    const mountPoint = document.createElement('div');
    mountPoint.id = 'widget-mount';
    shadowRoot.appendChild(mountPoint);

    // Inject CSS into Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      #widget-mount {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1f2937;
        box-sizing: border-box;
      }
      #widget-mount * {
        box-sizing: border-box;
      }
    `;
    shadowRoot.appendChild(style);

    // Inject font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Render React app
    const root = createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <ChatWidget />
      </React.StrictMode>
    );
    console.log('Amharic AI Widget: React component mounted');
  } catch (error) {
    console.error('Amharic AI Widget: Initialization error', error);
  }
};

// Initialize with multiple strategies for Next.js compatibility
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // DOM is already ready, but body might not be
  initWidget();
} else {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', initWidget);
}

// Also try after a delay as fallback (for Next.js)
setTimeout(initWidget, 100);
