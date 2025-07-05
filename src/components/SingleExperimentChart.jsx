import React, { useMemo, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, Filler, TimeScale 
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ThemeContext } from '../context/ThemeContext';

// ... (getChartOptions fonksiyonu aynı kalıyor) ...
const getChartOptions = (title, chartColors, isTimeScale, enableZoom, compactMode) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: isTimeScale ? 0 : 300, 
            easing: 'linear'
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: title, font: { size: 11, weight: '500', color: chartColors.textColorDarker }, padding: { top: 2, bottom: 8 }, align: 'start' },
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
        layout: { padding: { left: 5, right: 10, top: 0, bottom: 5 } }
    };
    return options;
};


function SingleExperimentChart({ chartType, data, isLive, enableZoom }) {
  const chartRef = useRef(null);
  const { theme } = useContext(ThemeContext);

  const chartColors = useMemo(() => {
    // ... (Bu fonksiyon içeriği değişmedi) ...
    const isLightTheme = theme === 'light';
    return {
      primary: '#42b983',
      secondary: '#3b82f6',
      error: '#ef4444',
      border: isLightTheme ? '#e2e8f0' : '#334155',
      textColor: isLightTheme ? '#1e293b' : '#f1f5f9',
      textColorDarker: isLightTheme ? '#475569' : '#cbd5e1',
      contentBg: isLightTheme ? '#ffffff' : '#1e293b',
    };
  }, [theme]);

  // === DEĞİŞİKLİK: Grafik verisini ve başlığı birlikte hesaplayan useMemo ===
  const { chartData, chartTitle, hasData } = useMemo(() => {
    const safeToFixed = (value, digits) => (typeof value === 'number' && !isNaN(value)) ? value.toFixed(digits) : null;

    if (chartType === 'loss') {
      const lossHistory = data?.history?.loss || data?.loss || [];
      const lastLoss = lossHistory.length > 0 ? safeToFixed(lossHistory[lossHistory.length - 1], 5) : null;
      const title = `Eğitim Kaybı ${lastLoss ? `(Son: ${lastLoss})` : ''}`;
      
      return {
        chartData: {
          labels: lossHistory.map((_, i) => `E${i + 1}`),
          datasets: [{
            label: 'Kayıp', data: lossHistory, borderColor: chartColors.primary,
            backgroundColor: `${chartColors.primary}33`,
            tension: 0.4, borderWidth: 2, pointRadius: 0, fill: 'origin',
          }]
        },
        chartTitle: title,
        hasData: lossHistory.length > 0
      };
    }
    if (chartType === 'prediction') {
      const MAX_POINTS = 250; 
      let timeIndex = data?.results?.time_index || data?.time_index || [];
      let yTrue = data?.results?.y_true || data?.y_true || [];
      let yPred = data?.results?.y_pred || data?.y_pred || [];
      const r2Score = safeToFixed(data?.results?.metrics?.r2_score, 4);
      const title = `Tahmin Performansı ${r2Score ? `(R²: ${r2Score})` : ''}`;

      if (!isLive && timeIndex.length > MAX_POINTS) {
          timeIndex = timeIndex.slice(-MAX_POINTS);
          yTrue = yTrue.slice(-MAX_POINTS);
          yPred = yPred.slice(-MAX_POINTS);
      }
      
      return {
        chartData: {
          datasets: [
            { label: 'Gerçek', data: yTrue.map((val, i) => ({ x: new Date(timeIndex[i]).getTime(), y: val })), borderColor: chartColors.secondary, borderWidth: 2, pointRadius: 0, tension: 0.1 },
            { label: 'Tahmin', data: yPred.map((val, i) => ({ x: new Date(timeIndex[i]).getTime(), y: val })), borderColor: chartColors.error, borderWidth: 2, pointRadius: 0, tension: 0.1, borderDash: [5, 5] }
          ]
        },
        chartTitle: title,
        hasData: timeIndex.length > 0
      };
    }
    return { chartData: { labels: [], datasets: [] }, chartTitle: '', hasData: false };
  }, [chartType, data, chartColors, isLive]);
  // === DEĞİŞİKLİK SONU ===

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {hasData ? (
        <Line
          ref={chartRef}
          data={chartData}
          options={getChartOptions(chartTitle, chartColors, chartType === 'prediction', enableZoom, false)}
        />
      ) : (
        <div style={{ display: 'grid', placeContent: 'center', height: '100%', color: 'var(--text-color-darker)', fontSize: '0.8em', fontStyle: 'italic' }}>
          {isLive ? 'Canlı veri bekleniyor...' : 'Veri mevcut değil.'}
        </div>
      )}
      {enableZoom && hasData && <p className="chart-instructions">Yakınlaştır/Sıfırla: Fare tekerleği/Çift tıkla, Kaydır: Alt + Sürükle</p>}
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