import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Legacy URL migration & Global Axios interceptor to dynamically rewrite server URL
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('POS_SERVER_URL');
  if (saved && saved.includes('darkblue-mosquito')) {
    localStorage.setItem('POS_SERVER_URL', 'https://apn.happypiecafe.in');
  }
}

axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const savedServer = localStorage.getItem('POS_SERVER_URL');
    if (savedServer) {
      const cleanServer = savedServer.trim().replace(/\/$/, "");
      const currentUrl = config.url || '';
      const apiIndex = currentUrl.indexOf('/api');
      if (apiIndex !== -1) {
        config.url = `${cleanServer}${currentUrl.substring(apiIndex)}`;
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}
