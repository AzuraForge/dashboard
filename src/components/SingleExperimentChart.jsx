// dashboard/src/components/SingleExperimentChart.jsx

import React, { useMemo, useRef, useContext } from 'react'; // useContext eklendi
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, Filler, TimeScale 
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ThemeContext } from '../context/ThemeContext'; // ThemeContext import edildi

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale, zoomPlugin);

// getCssVar fonksiyonuna artık gerek yok. Renkleri doğrudan alacağız.
const getChartOptions = (title, chartColors, isTimeScale, enableZoom, compactMode) => {
    // ... (bu fonksiyonun içeriği aynı kalıyor, değişiklik yok)
    const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isTimeScale ? 0 : 300, 
      easing: 'linear'
    },
    plugins: {
      legend: { display: false },
      title: { display: compactMode, text: title, font: { size: 10, color: chartColors.textColor }, padding: { top: 2, bottom: 4 } },
      tooltip: {
        enabled: true,
        backgroundColor: chartColors.contentBg,
        titleColor: chartColors.textColor,
        bodyColor: chartColors.textColor,
        borderColor: chartColors.border,
        borderWidth: 1,
        padding: 6,
        displayColors: true,
        callbacks: {
            label: (ctx) => `${ctx.dataset.label || ''}: ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(4) : ctx.parsed.y}`,
        }
      },
      zoom: {
        pan: { enabled: enableZoom, mode: 'x', modifierKey: 'alt', },
        zoom: { wheel: { enabled: enableZoom }, pinch: { enabled: true }, mode: 'x' },
      }
    },
    scales: {
      y: {
        grid: { color: chartColors.border, borderDash: [2, 4], drawTicks: false },
        ticks: { display: !compactMode, padding: 5, maxTicksLimit: 5, font: { size: 10, color: chartColors.textColorDarker } },
        beginAtZero: false,
      },
      x: isTimeScale ? {
        type: 'time',
        time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' },
        grid: { display: false },
        ticks: { font: { size: compactMode ? 8 : 10, color: chartColors.textColorDarker }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }
      } : {
        grid: { display: false },
        ticks: { display: !compactMode, padding: 5, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 10, color: chartColors.textColorDarker } },
      }
    },
    layout: { padding: { left: 5, right: 10, top: 5, bottom: 5 } }
  };
  return options;
};

function SingleExperimentChart({ chartType, data, isLive, enableZoom }) {
  const chartRef = useRef(null);
  const { theme } = useContext(ThemeContext); // Temayı context'ten al

  // DÜZELTME: Renkleri tema durumuna göre dinamik olarak belirliyoruz
  const chartColors = useMemo(() => {
    const isLightTheme = theme === 'light';
    return {
      primary: '#42b983',
      info: '#3b82f6',
      error: '#ef4444',
      border: isLightTheme ? '#e2e8f0' : '#334155',
      textColor: isLightTheme ? '#1e293b' : '#e2e8f0',
      textColorDarker: isLightTheme ? '#475569' : '#94a3b8',
      contentBg: isLightTheme ? '#ffffff' : '#1e293b',
    };
  }, [theme]);


  const chartData = useMemo(() => {
    if (chartType === 'loss') {
      const lossHistory = data?.loss || [];
      return {
        labels: lossHistory.map((_, i) => `E${i + 1}`),
        datasets: [{
          label: 'Kayıp', data: lossHistory, borderColor: chartColors.primary,
          backgroundColor: `${chartColors.primary}33`, // Opacity için hex'e 33 ekliyoruz
          tension: 0.4, borderWidth: 2, pointRadius: 0, fill: 'origin',
        }]
      };
    }
    if (chartType === 'prediction') {
      const timeIndex = data?.time_index || [];
      const yTrue = data?.y_true || [];
      const yPred = data?.y_pred || [];
      return {
        datasets: [
          { label: 'Gerçek', data: yTrue.map((val, i) => ({ x: new Date(timeIndex[i]).getTime(), y: val })), borderColor: chartColors.info, borderWidth: 2, pointRadius: 0, tension: 0.1 },
          { label: 'Tahmin', data: yPred.map((val, i) => ({ x: new Date(timeIndex[i]).getTime(), y: val })), borderColor: chartColors.error, borderWidth: 2, pointRadius: 0, tension: 0.1, borderDash: [5, 5] }
        ]
      };
    }
    return { labels: [], datasets: [] };
  }, [chartType, data, chartColors]);

  const chartTitle = chartType === 'loss' ? 'Eğitim Kaybı' : 'Tahmin Performansı';
  const hasData = (chartType === 'loss' && data?.loss?.length > 0) || (chartType === 'prediction' && data?.time_index?.length > 0);

  return (
    <div className="single-chart-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
      {hasData ? (
        <Line
          ref={chartRef}
          data={chartData}
          options={getChartOptions(chartTitle, chartColors, chartType === 'prediction', enableZoom, true)}
        />
      ) : (
        <div className="no-chart-data-message" style={{ /* ... stiller ... */ }}>{isLive ? 'Canlı veri bekleniyor...' : 'Veri mevcut değil.'}</div>
      )}
      {enableZoom && hasData && <p className="chart-instructions" style={{ /* ... stiller ... */ }}>Yakınlaştır/Sıfırla: Fare tekerleği/Çift tıkla, Kaydır: Alt + Sürükle</p>}
    </div>
  );
}

SingleExperimentChart.propTypes = {
  chartType: PropTypes.oneOf(['loss', 'prediction']).isRequired,
  data: PropTypes.object,
  isLive: PropTypes.bool,
  enableZoom: PropTypes.bool,
};

export default React.memo(SingleExperimentChart);