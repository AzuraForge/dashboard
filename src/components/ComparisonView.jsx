import React, { useEffect, useMemo, useContext } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import styles from './ComparisonView.module.css';
import { ThemeContext } from '../context/ThemeContext'; // ThemeContext'i import et

// Chart.js eklentilerini doğru şekilde kaydet
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler, zoomPlugin);

const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#7e22ce', '#15803d'];

// Helper fonksiyonlar
const safeGet = (obj, path, defaultValue = 'N/A') => {
  if (!obj || typeof path !== 'string') return defaultValue;
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return value !== undefined && value !== null ? value : defaultValue;
};

const analyzeMetrics = (experiments, metricPath, mode = 'min') => {
  const values = experiments.map(exp => ({ id: exp.experiment_id, value: safeGet(exp, metricPath, null) })).filter(item => typeof item.value === 'number');
  if (values.length < 2) return {};
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const bestId = (mode === 'min') ? sorted[0].id : sorted[sorted.length - 1].id;
  const worstId = (mode === 'min') ? sorted[sorted.length - 1].id : sorted[0].id;
  return { best: bestId, worst: worstId };
};

function ComparisonView({ experiments, title, onClose }) {
  const { theme } = useContext(ThemeContext); // Mevcut temayı context'ten al

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const metricAnalysis = useMemo(() => ({
      loss: analyzeMetrics(experiments, 'results.final_loss', 'min'),
      r2: analyzeMetrics(experiments, 'results.metrics.r2_score', 'max'),
      mae: analyzeMetrics(experiments, 'results.metrics.mae', 'min'),
  }), [experiments]);
  
  const getExperimentLabel = (exp) => {
    const params = [];
    const lr = safeGet(exp, 'config_summary.lr', safeGet(exp, 'config.training_params.lr', null));
    const hidden = safeGet(exp, 'config.model_params.hidden_size', null);
    if (lr !== null) params.push(`LR:${lr}`);
    if (hidden !== null) params.push(`Hidden:${hidden}`);
    return `...${exp.experiment_id.slice(-12)} (${params.join(', ')})`;
  };

  const commonChartOptions = useMemo(() => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const textColorDarker = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';

    return (chartTitle) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { 
        legend: { position: 'top', labels: { color: textColor, font: { size: 12 }, boxWidth: 15, padding: 20 } },
        title: { display: true, text: chartTitle, font: { size: 16, weight: 'bold' }, color: textColor },
        tooltip: { 
          backgroundColor: tooltipBg, 
          borderColor: gridColor, 
          borderWidth: 1, 
          titleColor: textColor, 
          bodyColor: textColor,
          bodyFont: { family: 'var(--font-mono)'},
          titleFont: { family: 'var(--font-sans)'},
          boxPadding: 8,
          padding: 12,
        },
        zoom: { pan: { enabled: true, mode: 'x', modifierKey: 'alt' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } }
      },
      scales: {
          y: { 
              title: { display: true, text: 'Kayıp Değeri (Loss)', font: { size: 12 }, color: textColorDarker }, 
              ticks: { color: textColorDarker }, 
              grid: { color: gridColor, borderDash: [2, 4] } 
          }, 
          x: { 
              title: { display: true, text: 'Epoch', font: { size: 12 }, color: textColorDarker }, 
              grid: { display: false }, 
              ticks: { color: textColorDarker }, 
              type: 'category' 
          } 
      }
    });
  }, [theme]);

  const lossChartData = useMemo(() => ({
    labels: Array.from({ length: Math.max(0, ...experiments.map(e => safeGet(e, 'results.history.loss.length', 0))) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: getExperimentLabel(exp),
      data: safeGet(exp, 'results.history.loss', []),
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: `${chartColors[i % chartColors.length]}33`,
      tension: 0.2, 
      fill: true,
      borderWidth: 2, 
      pointRadius: 1, 
      pointHoverRadius: 5,
    })),
  }), [experiments]);
  
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{title} ({experiments.length} adet)</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Kapat">×</button>
        </header>
        <div className={styles.body}>
          <div className={styles.chartContainer}>
            <Line data={lossChartData} options={commonChartOptions('Eğitim Kaybı Karşılaştırması')} />
            <p className="chart-instructions">Yakınlaştırmak için fare tekerleğini kullanın. Sıfırlamak için çift tıklayın. Kaydırmak için <strong>Alt + Sürükle</strong>.</p>
          </div>
          <h4 className={styles.sectionTitle}>Parametre ve Sonuçlar</h4>
          <div className={`table-container ${styles.summaryTableContainer}`}>
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th className={styles.idCellHeader}>Deney (ID)</th>
                  <th className={styles.numericHeader}>Öğrenme Oranı (LR)</th>
                  <th className={styles.numericHeader}>Gizli Katman Boyutu</th>
                  <th className={styles.numericHeader}>Final Kayıp</th>
                  <th className={styles.numericHeader}>R² Skoru</th>
                  <th className={styles.numericHeader}>Ort. Mutlak Hata (MAE)</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp, i) => {
                    const getCellStyle = (metricName) => {
                        const analysis = metricAnalysis[metricName];
                        if (!analysis || typeof analysis.best === 'undefined') return '';
                        if (analysis.best === exp.experiment_id) return styles.bestMetric;
                        if (analysis.worst === exp.experiment_id) return styles.worstMetric;
                        return '';
                    };
                    return (
                      <tr key={exp.experiment_id}>
                        <td className={styles.idCell}>
                          <span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>
                          ...{exp.experiment_id.slice(-12)}
                        </td>
                        <td className={styles.numericCell}>{safeGet(exp, 'config_summary.lr', 'N/A')}</td>
                        <td className={styles.numericCell}>{safeGet(exp, 'config.model_params.hidden_size', 'N/A')}</td>
                        <td className={`${styles.numericCell} ${getCellStyle('loss')}`}>{safeGet(exp, 'results.final_loss', 'N/A').toFixed ? safeGet(exp, 'results.final_loss').toFixed(6) : 'N/A'}</td>
                        <td className={`${styles.numericCell} ${getCellStyle('r2')}`}>{safeGet(exp, 'results.metrics.r2_score', 'N/A').toFixed ? safeGet(exp, 'results.metrics.r2_score').toFixed(4) : 'N/A'}</td>
                        <td className={`${styles.numericCell} ${getCellStyle('mae')}`}>{safeGet(exp, 'results.metrics.mae', 'N/A').toFixed ? safeGet(exp, 'results.metrics.mae').toFixed(4) : 'N/A'}</td>
                      </tr>
                    )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

ComparisonView.propTypes = {
  experiments: PropTypes.array.isRequired,
  title: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ComparisonView;