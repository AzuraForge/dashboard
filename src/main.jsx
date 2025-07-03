// dashboard/src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext'; // <-- AuthProvider eklendi

// Fontsource
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Stil dosyaları
import './index.css'; 
import './App.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider> {/* <-- App, AuthProvider ile sarıldı */}
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  // </React.StrictMode>
);