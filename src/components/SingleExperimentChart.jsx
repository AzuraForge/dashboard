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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale, zoomPlugin);

const getChartOptions = (title, chartColors, isTimeScale, enableZoom, compactMode) => {
    // ... Bu fonksiyon içeriği değişmedi ...
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
  const { theme } = useContext(ThemeContext);

  const chartColors = useMemo(() => {
    // ... Bu fonksiyon içeriği değişmedi ...
    const isLightTheme = theme === 'light';
    return {
      primary: '#42b983',
      info: '#3b82f6',
      error: '#ef4444',
      border: isLightTheme ? '#e2e8f0' : '#334155',
      textColor: isLightTheme ? '#1e293b' : '#f1f5f9',
      textColorDarker: isLightTheme ? '#475569' : '#cbd5e1',
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
          backgroundColor: `${chartColors.primary}33`,
          tension: 0.4, borderWidth: 2, pointRadius: 0, fill: 'origin',
        }]
      };
    }
    if (chartType === 'prediction') {
      // === UI/UX İYİLEŞTİRMESİ: Gürültü Azaltma ===
      // Grafikte gösterilecek maksimum nokta sayısı
      const MAX_POINTS = 250; 
      let timeIndex = data?.results?.time_index || data?.time_index || [];
      let yTrue = data?.results?.y_true || data?.y_true || [];
      let yPred = data?.results?.y_pred || data?.y_pred || [];

      // Eğer veri canlı değilse ve nokta sayısı limiti aşıyorsa, sadece son N noktayı al
      if (!isLive && timeIndex.length > MAX_POINTS) {
          timeIndex = timeIndex.slice(-MAX_POINTS);
          yTrue = yTrue.slice(-MAX_POINTS);
          yPred = yPred.slice(-MAX_POINTS);
      }
      // === İYİLEŞTİRME SONU ===

      return {
        datasets: [
          { label: 'Gerçek', data: yTrue.map((val, i) => ({ x: new Date(timeIndex[i]).getTime(), y: val })), borderColor: chartColors.info, borderWidth: 2, pointRadius: 0, tension: 0.1 },
          { label: 'Tahmin', data: yPred.map((val, i) => ({ x: new Date(timeIndex[i]).getTime(), y: val })), borderColor: chartColors.error, borderWidth: 2, pointRadius: 0, tension: 0.1, borderDash: [5, 5] }
        ]
      };
    }
    return { labels: [], datasets: [] };
  }, [chartType, data, chartColors, isLive]);

  const chartTitle = chartType === 'loss' ? 'Eğitim Kaybı' : 'Tahmin Performansı';
  const hasData = (chartType === 'loss' && data?.loss?.length > 0) || 
                  (chartType === 'prediction' && ( (data?.results?.time_index?.length > 0) || (data?.time_index?.length > 0) ));

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {hasData ? (
        <Line
          ref={chartRef}
          data={chartData}
          options={getChartOptions(chartTitle, chartColors, chartType === 'prediction', enableZoom, true)}
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