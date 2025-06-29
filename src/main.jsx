import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Chart } from 'chart.js';
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

// --- GÜNCELLENMİŞ GLOBAL CHART.JS AYARLARI ---
const setupChartDefaults = (theme = 'dark') => {
  try {
    const styles = getComputedStyle(document.body);
    const textColorDarker = styles.getPropertyValue('--text-color-darker').trim();
    const borderColor = styles.getPropertyValue('--border-color').trim();

    // Global varsayılanları ayarla. Bu, eksenler, başlıklar ve etiketler dahil tüm metinleri etkiler.
    Chart.defaults.color = textColorDarker; 
    Chart.defaults.borderColor = borderColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Chart.overrides satırları KALDIRILDI. Bu özellik artık Chart.js v4'te mevcut değil.
    // Yukarıdaki global ayarlar yeterlidir.

  } catch (e) {
    console.error("Chart.js varsayılanları ayarlanırken bir hata oluştu:", e);
  }
};

// İlk yüklemede ve tema değişimlerinde çalışacak
setTimeout(() => setupChartDefaults(), 100);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider setupChartDefaults={setupChartDefaults}>
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);