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

// --- GLOBAL CHART.JS AYARLARI ---
// Not: Bu ayarlar tema değiştiğinde ThemeContext tarafından güncellenecek
const setupChartDefaults = (theme = 'dark') => {
  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue('--text-color').trim();
  const textColorDarker = styles.getPropertyValue('--text-color-darker').trim();
  const borderColor = styles.getPropertyValue('--border-color').trim();

  Chart.defaults.color = textColorDarker;
  Chart.defaults.borderColor = borderColor;
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.overrides.line.plugins.legend.labels.color = textColor;
  Chart.overrides.line.plugins.title.color = textColor;
};

// İlk yüklemede ayarları yap
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