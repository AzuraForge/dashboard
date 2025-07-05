import PropTypes from 'prop-types';
import React, { useMemo } from 'react'; // useMemo import'u eklendi
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import styles from './ComparisonView.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, zoomPlugin);

const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#7e22ce', '#15803d'];

const safeGet = (obj, path, defaultValue = 'N/A') => {
  if (!obj || typeof path !== 'string') return defaultValue;
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return value !== undefined && value !== null ? value : defaultValue;
};

// === YENİ: Metrikleri analiz edip en iyi/kötü değerleri bulan helper ===
const analyzeMetrics = (experiments, metricPath, mode = 'min') => {
  const values = experiments.map(exp => ({ id: exp.experiment_id, value: safeGet(exp, metricPath, null) })).filter(item => item.value !== null);
  if (values.length < 2) return {};

  const sorted = [...values].sort((a, b) => a.value - b.value);
  const bestId = (mode === 'min') ? sorted[0].id : sorted[sorted.length - 1].id;
  const worstId = (mode === 'min') ? sorted[sorted.length - 1].id : sorted[0].id;

  return { best: bestId, worst: worstId };
};

function ComparisonView({ experiments, title, showCloseButton = false, onClose = () => {} }) {

  // === YENİ: Karşılaştırma metriklerini hesaplayan useMemo ===
  const metricAnalysis = useMemo(() => {
    return {
      loss: analyzeMetrics(experiments, 'results.final_loss', 'min'),
      r2: analyzeMetrics(experiments, 'results.metrics.r2_score', 'max'),
      mae: analyzeMetrics(experiments, 'results.metrics.mae', 'min'),
    };
  }, [experiments]);

  // === DEĞİŞİKLİK: Dinamik etiketler için düzenleme ===
  const getExperimentLabel = (exp) => {
    const params = [];
    if (safeGet(exp, 'config.training_params.lr', null) !== null) params.push(`LR:${safeGet(exp, 'config.training_params.lr')}`);
    if (safeGet(exp, 'config.model_params.hidden_size', null) !== null) params.push(`Hidden:${safeGet(exp, 'config.model_params.hidden_size')}`);
    return `ID ${exp.experiment_id.slice(0,8)} (${params.join(', ') || '...'})`;
  };

  const commonChartOptions = (chartTitle) => ({
      // ... Bu fonksiyon içeriği değişmedi ...
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
  
  const content = (
    <>
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
              <th>Öğrenme Oranı (LR)</th>
              <th>Gizli Katman Boyutu</th>
              <th className={styles.metricHeader}>Final Kayıp</th>
              <th className={styles.metricHeader}>R² Skoru</th>
              <th className={styles.metricHeader}>Ort. Mutlak Hata (MAE)</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp, i) => {
                // === YENİ: Her hücre için stil belirleme ===
                const getCellStyle = (metricName, analysis) => {
                    if (analysis.best === exp.experiment_id) return styles.bestMetric;
                    if (analysis.worst === exp.experiment_id) return styles.worstMetric;
                    return '';
                };

                return (
                  <tr key={exp.experiment_id}>
                    <td>
                      <span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>
                      {exp.experiment_id.slice(0, 8)}...
                    </td>
                    <td>{safeGet(exp, 'config.training_params.lr', 'N/A')}</td>
                    <td>{safeGet(exp, 'config.model_params.hidden_size', 'N/A')}</td>
                    <td className={getCellStyle('loss', metricAnalysis.loss)}>{safeGet(exp, 'results.final_loss', 'N/A').toFixed ? safeGet(exp, 'results.final_loss').toFixed(6) : 'N/A'}</td>
                    <td className={getCellStyle('r2', metricAnalysis.r2)}>{safeGet(exp, 'results.metrics.r2_score', 'N/A').toFixed ? safeGet(exp, 'results.metrics.r2_score').toFixed(4) : 'N/A'}</td>
                    <td className={getCellStyle('mae', metricAnalysis.mae)}>{safeGet(exp, 'results.metrics.mae', 'N/A').toFixed ? safeGet(exp, 'results.metrics.mae').toFixed(4) : 'N/A'}</td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  if (showCloseButton) {
    // ... Bu kısım değişmedi ...
  }

  return <div className={styles.body}>{content}</div>;
}

ComparisonView.propTypes = {
  experiments: PropTypes.array.isRequired,
  title: PropTypes.string,
  showCloseButton: PropTypes.bool,
  onClose: PropTypes.func,
};

export default ComparisonView;