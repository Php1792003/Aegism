import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hook localStorage.setItem to dispatch 'user-profile-updated' events for instant cross-component synchronization
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
  originalSetItem.apply(this, arguments as any);
  if (key === 'user') {
    window.dispatchEvent(new Event('user-profile-updated'));
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

