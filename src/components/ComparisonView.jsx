import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import styles from './ComparisonView.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, zoomPlugin);

const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#7e22ce', '#15803d'];

// Helper to safely get nested properties
const safeGet = (obj, path, defaultValue = 'N/A') => {
  if (!obj || typeof path !== 'string') {
    return defaultValue;
  }
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return value !== undefined && value !== null ? value : defaultValue;
};

function ComparisonView({ experiments, title, showCloseButton = false, onClose = () => {} }) {

  const commonChartOptions = (chartTitle) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { 
        legend: { 
          position: 'top', 
          labels: { 
            color: 'var(--text-color-darker)', 
            font: { size: 12 }, 
            boxWidth: 15, 
            padding: 20 
          } 
        },
        title: { 
          display: true, 
          text: chartTitle, 
          font: { size: 16, weight: 'bold' }, 
          color: 'var(--text-color)' 
        },
        tooltip: {
          backgroundColor: 'var(--content-bg)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
          titleColor: 'var(--text-color)',
          bodyColor: 'var(--text-color)',
          boxPadding: 4,
        },
        zoom: {
          pan: { enabled: true, mode: 'x', modifierKey: 'alt' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
        }
      },
      scales: {
          y: { 
            title: { 
              display: true, 
              text: 'Kayıp Değeri (Loss)', 
              font: { size: 12 }, 
              color: 'var(--text-color-darker)' 
            }, 
            ticks: { color: 'var(--text-color-darker)' }, 
            grid: { color: 'var(--border-color)', borderDash: [2, 4] } 
          }, 
          x: { 
            title: { 
              display: true, 
              text: 'Epoch', 
              font: { size: 12 }, 
              color: 'var(--text-color-darker)' 
            }, 
            grid: { display: false },
            ticks: { color: 'var(--text-color-darker)' },
            type: 'category',
          } 
      }
  });

  const lossChartData = {
    labels: Array.from({ length: Math.max(0, ...experiments.map(e => safeGet(e, 'results.history.loss.length', 0))) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: `ID ${exp.experiment_id.slice(0,8)} (LR: ${safeGet(exp, 'config.training_params.lr')}, Hidden: ${safeGet(exp, 'config.model_params.hidden_size')})`,
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
              <th>Final Kayıp</th>
              <th>R² Skoru</th>
              <th>Ort. Mutlak Hata (MAE)</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp, i) => (
              <tr key={exp.experiment_id}>
                <td>
                  <span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>
                  {exp.experiment_id.slice(0, 8)}...
                </td>
                <td>{safeGet(exp, 'config.training_params.lr', 'N/A')}</td>
                <td>{safeGet(exp, 'config.model_params.hidden_size', 'N/A')}</td>
                <td>{safeGet(exp, 'results.final_loss', 'N/A').toFixed ? safeGet(exp, 'results.final_loss').toFixed(6) : 'N/A'}</td>
                <td>{safeGet(exp, 'results.metrics.r2_score', 'N/A').toFixed ? safeGet(exp, 'results.metrics.r2_score').toFixed(4) : 'N/A'}</td>
                <td>{safeGet(exp, 'results.metrics.mae', 'N/A').toFixed ? safeGet(exp, 'results.metrics.mae').toFixed(4) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (showCloseButton) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <header className={styles.header}>
            <h2>{title} ({experiments.length} adet)</h2>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </header>
          <div className={styles.body}>{content}</div>
        </div>
      </div>
    );
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