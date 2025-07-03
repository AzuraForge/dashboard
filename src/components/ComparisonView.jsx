import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import styles from './ComparisonView.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, zoomPlugin);

const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#7e22ce', '#15803d'];

function ComparisonView({ experiments, title, showCloseButton = false, onClose = () => {} }) {

  const commonChartOptions = (chartTitle, isTimeScale = false) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { 
        legend: { position: 'top', labels: { color: 'var(--text-color-darker)', font: { size: 12 } } },
        title: { display: true, text: chartTitle, font: { size: 16, weight: 'bold' }, color: 'var(--text-color)' },
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
            title: { display: true, text: title.includes('Kayıp') ? 'Kayıp Değeri (Loss)' : 'Değer' }, 
            ticks: { color: 'var(--text-color-darker)' }, 
            grid: { color: 'var(--border-color)', borderDash: [2, 4] } 
          }, 
          x: { 
            title: { display: true, text: isTimeScale ? 'Tarih' : 'Epoch' }, 
            grid: { display: false },
            ticks: { color: 'var(--text-color-darker)' },
            type: isTimeScale ? 'time' : 'category',
            time: isTimeScale ? { unit: 'day', tooltipFormat: 'yyyy-MM-dd' } : {},
          } 
      }
  });

  const lossChartData = {
    labels: Array.from({ length: Math.max(0, ...experiments.map(e => e.results?.history?.loss?.length || 0)) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: `${exp.config?.training_params?.lr || 'N/A'} LR / ${exp.config?.model_params?.hidden_size || 'N/A'} Hidden`,
      data: exp.results?.history?.loss || [], 
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
      
      <h4 className="section-title" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Parametre ve Sonuçlar</h4>
      <div className={`table-container ${styles.summaryTableContainer}`}>
        <table>
          <thead>
            <tr>
              <th>LR</th>
              <th>Gizli Katman</th>
              <th>Final Kayıp</th>
              <th>R² Skoru</th>
              <th>MAE</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp, i) => (
              <tr key={exp.experiment_id}>
                <td><span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>{exp.config?.training_params?.lr ?? 'N/A'}</td>
                <td>{exp.config?.model_params?.hidden_size ?? 'N/A'}</td>
                <td>{exp.results?.final_loss?.toFixed(6) ?? 'N/A'}</td>
                <td>{exp.results?.metrics?.r2_score?.toFixed(4) ?? 'N/A'}</td>
                <td>{exp.results?.metrics?.mae?.toFixed(4) ?? 'N/A'}</td>
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
            <button className="close-button" onClick={onClose}>×</button>
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