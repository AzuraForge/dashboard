import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Chart, Filler } from 'chart.js';
import { ThemeProvider } from './context/ThemeContext';

// Fontsource paketinden Inter fontunu ve stillerini import et
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Stil dosyalarımız
import './index.css'; 
import './App.css';
import App from './App.jsx';

// Gerekli Chart.js eklentilerini kaydet
Chart.register(Filler);

const setupChartDefaults = (theme = 'dark') => {
  try {
    const styles = getComputedStyle(document.body);
    const textColorDarker = styles.getPropertyValue('--text-color-darker').trim();
    const borderColor = styles.getPropertyValue('--border-color').trim();

    Chart.defaults.color = textColorDarker; 
    Chart.defaults.borderColor = borderColor;
    Chart.defaults.font.family = "'Inter', sans-serif";
  } catch (e) {
    console.error("Chart.js varsayılanları ayarlanırken bir hata oluştu:", e);
  }
};

setTimeout(() => setupChartDefaults(), 100);

createRoot(document.getElementById('root')).render(
  // WebSocket gibi kalıcı bağlantılarla ilgili geliştirme hatalarını önlemek için
  // StrictMode bilinçli olarak devre dışı bırakılmıştır.
  // Bu değişikliğin production build'ine bir etkisi yoktur.
  
  // <React.StrictMode>
    <ThemeProvider setupChartDefaults={setupChartDefaults}>
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </ThemeProvider>
  // </React.StrictMode>
);