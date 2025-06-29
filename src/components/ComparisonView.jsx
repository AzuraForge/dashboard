import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Grafik çizgileri için renk paleti
const chartColors = [
  '#42b983', // primary
  '#3b82f6', // secondary
  '#ef4444', // error
  '#f59e0b', // warning
  '#8b5cf6', // violet
  '#ec4899', // pink
];

function ComparisonView({ experiments, onClose }) {
  // Grafik verisini dinamik olarak oluştur
  const chartData = {
    // En uzun kayıp geçmişine sahip deneyi bul ve etiketleri ona göre ayarla
    labels: Array.from({ length: Math.max(...experiments.map(e => e.results?.loss?.length || 0)) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: `${exp.config.data_sourcing.ticker} (${exp.experiment_id.slice(-6)})`,
      data: exp.results?.loss || [],
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: `${chartColors[i % chartColors.length]}33`, // %20 opacity
      tension: 0.2,
      fill: false,
      borderWidth: 2,
    })),
  };

  const chartOptions = {
      responsive: true, maintainAspectRatio: false,
      plugins: { 
        legend: { position: 'top', labels: { color: 'var(--text-color)' } }, 
        tooltip: { enabled: true, mode: 'index', intersect: false, } 
      },
      scales: { 
          y: { title: { display: true, text: 'Kayıp Değeri', color: 'var(--text-color-darker)' }, beginAtZero: false, ticks: { color: 'var(--text-color-darker)' }, grid: { color: 'var(--border-color)' } }, 
          x: { title: { display: true, text: 'Epoch', color: 'var(--text-color-darker)' }, ticks: { color: 'var(--text-color-darker)', autoSkip: true, maxTicksLimit: 20 }, grid: { display: false } } 
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
          </div>

          <h4 className="section-title">Özet Tablosu</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Deney ID</th>
                  <th>Ticker</th>
                  <th>Epochs</th>
                  <th>LR</th>
                  <th>Final Kayıp</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp, i) => (
                  <tr key={exp.experiment_id}>
                    <td>
                      <span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>
                      {exp.experiment_id.slice(0, 18)}...
                    </td>
                    <td>{exp.config.data_sourcing.ticker}</td>
                    <td>{exp.config.training_params.epochs}</td>
                    <td>{exp.config.training_params.lr}</td>
                    <td>{exp.results.final_loss?.toFixed(6) ?? 'N/A'}</td>
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

ComparisonView.propTypes = {
  experiments: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ComparisonView;