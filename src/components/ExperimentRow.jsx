import { useState } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';

// Chart.js bileşenleri zaten App.jsx'te veya başka bir yerde register edilmiş olmalı,
// ama burada tekrar etmekte zarar yok.
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


function ExperimentRow({ experiment }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { experiment_id, status, config, results, completed_at, failed_at } = experiment;
  const pipeline_name = config?.pipeline_name || 'N/A';
  const ticker = config?.data_sourcing?.ticker || 'N/A';
  const final_loss = results?.final_loss;
  const finish_time = completed_at || failed_at;
  const loss_history = results?.loss || [];

  const chartData = {
    labels: Array.from({ length: loss_history.length }, (_, i) => `E${i + 1}`),
    datasets: [{
      label: 'Eğitim Kaybı',
      data: loss_history,
      borderColor: 'var(--primary-color)',
      backgroundColor: 'rgba(66, 185, 131, 0.2)',
      tension: 0.2,
      fill: true,
    }]
  };

  const chartOptions = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: { 
          y: { beginAtZero: false, ticks: { color: 'var(--text-color-darker)' }, grid: { color: 'var(--border-color)' } }, 
          x: { ticks: { color: 'var(--text-color-darker)', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } } 
      }
  };

  return (
    <>
      <tr onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
        <td className="exp-id">{experiment_id}</td>
        <td><span className={`status-badge status-${status?.toLowerCase() || 'unknown'}`}>{status || 'Bilinmiyor'}</span></td>
        <td>{pipeline_name}</td>
        <td>{ticker}</td>
        <td>{final_loss !== undefined && final_loss !== null ? final_loss.toFixed(6) : 'N/A'}</td>
        <td>{finish_time ? new Date(finish_time).toLocaleString() : 'N/A'}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" style={{ padding: '0' }}>
            <div className="expanded-row-content">
              <div className="detail-section">
                <h4>Konfigürasyon</h4>
                <pre className="code-block">{JSON.stringify(config, null, 2)}</pre>
              </div>
              <div className="detail-section">
                <h4>Sonuçlar & Grafik</h4>
                {loss_history.length > 0 ? (
                    <div className="detail-chart-container">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                ) : <p>Grafik için geçmiş verisi bulunamadı.</p>}
                <pre className="code-block">{JSON.stringify(results, null, 2)}</pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

ExperimentRow.propTypes = {
  experiment: PropTypes.object.isRequired,
};

export default ExperimentRow;