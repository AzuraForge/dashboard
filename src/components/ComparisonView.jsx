import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

function ComparisonView({ experiments, onClose }) {
  const chartData = {
    labels: Array.from({ length: Math.max(...experiments.map(e => e.results?.history?.loss?.length || 0)) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: `${exp.config.data_sourcing.ticker} (${exp.experiment_id.slice(-6)})`,
      data: exp.results?.history?.loss || [], 
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: `${chartColors[i % chartColors.length]}33`,
      tension: 0.1, fill: false, borderWidth: 2, pointRadius: 1, pointHoverRadius: 5,
    })),
  };

  const chartOptions = {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false, },
      plugins: { 
        legend: { position: 'top', labels: { font: { size: 14 } } },
        tooltip: {
          backgroundColor: 'var(--content-bg)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
        },
        zoom: {
          pan: { enabled: true, mode: 'xy', modifierKey: 'alt', },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }
        }
      },
      scales: {
          y: { title: { display: true, text: 'Kayıp Değeri (Loss)' }, beginAtZero: false, }, 
          x: { title: { display: true, text: 'Epoch' }, grid: { display: false } } 
      }
  };

  return (
    <div className="comparison-modal-overlay" onClick={onClose}>
      <div className="comparison-modal-content" onClick={e => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>Deney Karşılaştırması ({experiments.length} adet)</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="comparison-body">
          <div className="comparison-chart-container">
            <Line data={chartData} options={chartOptions} />
            <p className="chart-instructions">Yakınlaştırmak için fare tekerleğini kullanın. Sıfırlamak için çift tıklayın. Kaydırmak için <strong>Alt + Sürükle</strong>.</p>
          </div>
          <h4 className="section-title" style={{ marginTop: 0 }}>Özet Tablosu</h4>
          <div className="table-container">
            <table>
              <thead><tr><th>Deney ID</th><th>Ticker</th><th>Epochs</th><th>LR</th><th>Final Kayıp</th></tr></thead>
              <tbody>
                {experiments.map((exp, i) => (
                  <tr key={exp.experiment_id}>
                    <td><span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>{exp.experiment_id.slice(0, 18)}...</td>
                    <td>{exp.config?.data_sourcing?.ticker ?? 'N/A'}</td>
                    <td>{Array.isArray(exp.config?.training_params?.epochs) ? exp.config.training_params.epochs[0] : exp.config?.training_params?.epochs ?? 'N/A'}</td>
                    <td>{Array.isArray(exp.config?.training_params?.lr) ? exp.config.training_params.lr[0] : exp.config?.training_params?.lr ?? 'N/A'}</td>
                    <td>{exp.results?.final_loss?.toFixed(6) ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
ComparisonView.propTypes = { experiments: PropTypes.array.isRequired, onClose: PropTypes.func.isRequired, };
export default ComparisonView;