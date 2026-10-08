import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign WebSocket / network drop rejections on unstable connections from showing error popups
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('Failed to fetch')) {
    event.preventDefault();
  }
});

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);


