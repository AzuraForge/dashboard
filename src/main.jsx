import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// GÜNCELLEME: Filler eklentisini Chart'tan import ediyoruz
import { Chart, Filler } from 'chart.js';
import { ThemeProvider } from './context/ThemeContext';

// Fontsource paketinden Inter fontunu ve stillerini import et
import '@fontsource/inter/400.css'; // Regular
import '@fontsource/inter/500.css'; // Medium
import '@fontsource/inter/600.css'; // SemiBold
import '@fontsource/inter/700.css'; // Bold

// Stil dosyalarımız
import './index.css'; 
import './App.css';
import App from './App.jsx';

// GÜNCELLEME: Filler eklentisini Chart.js'e kaydediyoruz
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
  <ThemeProvider setupChartDefaults={setupChartDefaults}>
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </ThemeProvider>
);