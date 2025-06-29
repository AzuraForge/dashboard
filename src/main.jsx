import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Chart.js kütüphanesini ve varsayılanlarını değiştirmek için Chart nesnesini import et
import { Chart } from 'chart.js';

// Fontsource paketinden Inter fontunu ve stillerini import et
import '@fontsource/inter/400.css'; // Regular
import '@fontsource/inter/500.css'; // Medium
import '@fontsource/inter/600.css'; // SemiBold
import '@fontsource/inter/700.css'; // Bold

// Stil dosyalarımız
import './index.css'; 
import './App.css';
import App from './App.jsx';

// --- YENİ: GLOBAL CHART.JS AYARLARI ---
// CSS değişkenlerinden renkleri okuyup Chart.js için varsayılan olarak atıyoruz.
// Bu kod, React render edilmeden önce çalışarak tüm grafiklerin doğru renkte olmasını sağlar.
try {
  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-color').trim();
  const textColorDarker = styles.getPropertyValue('--text-color-darker').trim();
  const borderColor = styles.getPropertyValue('--border-color').trim();

  Chart.defaults.color = textColorDarker; // Tüm metinler için varsayılan renk
  Chart.defaults.borderColor = borderColor; // Tüm kenarlıklar (ızgaralar dahil) için varsayılan renk

  Chart.defaults.font.family = "'Inter', sans-serif"; // Varsayılan font ailesi

  // Belirli elemanlar için daha detaylı ayarlar
  Chart.overrides.line.plugins.legend.labels.color = textColor;
  Chart.overrides.line.plugins.title.color = textColor;
  
} catch (e) {
  console.error("Could not set Chart.js defaults:", e);
}
// --- GLOBAL AYARLAR SONU ---


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </StrictMode>,
);