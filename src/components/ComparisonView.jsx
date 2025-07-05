import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import styles from './ComparisonView.module.css';

// ... (ChartJS.register, chartColors, safeGet, analyzeMetrics fonksiyonları aynı kalıyor) ...
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, zoomPlugin);
const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#7e22ce', '#15803d'];
const safeGet = (obj, path, defaultValue = 'N/A') => { /* ... no changes ... */ };
const analyzeMetrics = (experiments, metricPath, mode = 'min') => { /* ... no changes ... */ };


function ComparisonView({ experiments, title, onClose }) {

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

  // === DÜZELTME: Grafik etiketleri daha da basitleştirildi ve kısaltıldı ===
  const getExperimentLabel = (exp) => {
    const params = [];
    // config_summary'den almaya çalış, yoksa ana config'den al
    const lr = safeGet(exp, 'config_summary.lr', safeGet(exp, 'config.training_params.lr', null));
    const hidden = safeGet(exp, 'config.model_params.hidden_size', null);
    
    if (lr !== null) params.push(`LR:${lr}`);
    if (hidden !== null) params.push(`Hidden:${hidden}`);

    // ID'nin sadece son, daha benzersiz olan kısmını al
    return `...${exp.experiment_id.slice(-12)} (${params.join(', ')})`;
  };

  const commonChartOptions = (chartTitle) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { 
        legend: { position: 'top', labels: { color: 'var(--text-color-darker)', font: { size: 12 }, boxWidth: 15, padding: 20 } },
        title: { display: true, text: chartTitle, font: { size: 16, weight: 'bold' }, color: 'var(--text-color)' },
        tooltip: { backgroundColor: 'var(--content-bg)', borderColor: 'var(--border-color)', borderWidth: 1, titleColor: 'var(--text-color)', bodyColor: 'var(--text-color)', boxPadding: 4, },
        zoom: { pan: { enabled: true, mode: 'x', modifierKey: 'alt' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } }
      },
      scales: {
          y: { title: { display: true, text: 'Kayıp Değeri (Loss)', font: { size: 12 }, color: 'var(--text-color-darker)' }, ticks: { color: 'var(--text-color-darker)' }, grid: { color: 'var(--border-color)', borderDash: [2, 4] } }, 
          x: { title: { display: true, text: 'Epoch', font: { size: 12 }, color: 'var(--text-color-darker)' }, grid: { display: false }, ticks: { color: 'var(--text-color-darker)' }, type: 'category' } 
      }
  });

  const lossChartData = {
    labels: Array.from({ length: Math.max(0, ...experiments.map(e => safeGet(e, 'results.history.loss.length', 0))) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: getExperimentLabel(exp),
      data: safeGet(exp, 'results.history.loss', []),
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: `${chartColors[i % chartColors.length]}33`,
      tension: 0.2, fill: false, borderWidth: 2, pointRadius: 1, pointHoverRadius: 5,
    })),
  };
  
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
                  <th>Deney (ID)</th>
                  <th className={styles.numericHeader}>Öğrenme Oranı (LR)</th>
                  <th className={styles.numericHeader}>Gizli Katman Boyutu</th>
                  <th className={styles.numericHeader}>Final Kayıp</th>
                  <th className={styles.numericHeader}>R² Skoru</th>
                  <th className={styles.numericHeader}>Ort. Mutlak Hata (MAE)</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp, i) => {
                    const getCellStyle = (metricName, analysis) => {
                        if (analysis.best === exp.experiment_id) return styles.bestMetric;
                        if (analysis.worst === exp.experiment_id) return styles.worstMetric;
                        return '';
                    };
                    return (
                      <tr key={exp.experiment_id}>
                        <td>
                          <span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>
                          ...{exp.experiment_id.slice(-12)}
                        </td>
                        <td className={styles.numericCell}>{safeGet(exp, 'config_summary.lr', 'N/A')}</td>
                        <td className={styles.numericCell}>{safeGet(exp, 'config.model_params.hidden_size', 'N/A')}</td>
                        <td className={`${styles.numericCell} ${getCellStyle('loss', metricAnalysis.loss)}`}>{safeGet(exp, 'results.final_loss', 'N/A').toFixed ? safeGet(exp, 'results.final_loss').toFixed(6) : 'N/A'}</td>
                        <td className={`${styles.numericCell} ${getCellStyle('r2', metricAnalysis.r2)}`}>{safeGet(exp, 'results.metrics.r2_score', 'N/A').toFixed ? safeGet(exp, 'results.metrics.r2_score').toFixed(4) : 'N/A'}</td>
                        <td className={`${styles.numericCell} ${getCellStyle('mae', metricAnalysis.mae)}`}>{safeGet(exp, 'results.metrics.mae', 'N/A').toFixed ? safeGet(exp, 'results.metrics.mae').toFixed(4) : 'N/A'}</td>
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