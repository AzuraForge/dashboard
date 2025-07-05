import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Fontsource
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// === YENİ: Stil Dosyalarının Doğru Sırayla Import Edilmesi ===
// 1. Temel ve Global Stiller (Değişkenler, Reset, Body)
import './index.css'; 
// 2. Yardımcı Sınıflar (Card, Button, Badge vb.)
import './styles/utilities.css';
// 3. Ana Uygulama Düzeni
import './App.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);