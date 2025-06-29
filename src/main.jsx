// ========== GÜNCELLENECEK DOSYA: dashboard/src/main.jsx ==========
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; // BrowserRouter import edildi

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Uygulamayı BrowserRouter ile sarmala */}
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </StrictMode>,
);