import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
// YENİ: Zoom plugin'ini import ediyoruz
import zoomPlugin from 'chartjs-plugin-zoom';

// YENİ: Zoom plugin'ini Chart.js'e kaydediyoruz
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

function ComparisonView({ experiments, onClose }) {
  const chartData = {
    labels: Array.from({ length: Math.max(...experiments.map(e => e.results?.loss?.length || 0)) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: `${exp.config.data_sourcing.ticker} (${exp.experiment_id.slice(-6)})`,
      data: exp.results?.loss || [],
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: `${chartColors[i % chartColors.length]}33`,
      tension: 0.1, // Daha yumuşak geçişler için 0.1
      fill: false,
      borderWidth: 2,
      pointRadius: 1, // Noktaları daha küçük yap
      pointHoverRadius: 5, // Hover'da büyüt
    })),
  };

  const chartOptions = {
      responsive: true, maintainAspectRatio: false,
      interaction: { // GÜNCELLEME: Daha iyi tooltip etkileşimi
        mode: 'index',
        intersect: false,
      },
      plugins: { 
        // GÜNCELLEME: Legend (etiket listesi) rengini düzelt
        legend: { 
          position: 'top', 
          labels: { 
            color: 'var(--text-color)',
            font: { size: 14 }
          } 
        },
        // GÜNCELLEME: Tooltip (üzerine gelince çıkan kutucuk) stilleri
        tooltip: {
          enabled: true,
          backgroundColor: 'var(--content-bg)',
          titleColor: 'var(--text-color)',
          bodyColor: 'var(--text-color-darker)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
        },
        // YENİ: Zoom plugin'i konfigürasyonu
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy', // Hem yatay hem dikey kaydırma
            modifierKey: 'alt', // Sadece Alt tuşuna basılıyken kaydır
          },
          zoom: {
            wheel: {
              enabled: true, // Mouse tekerleği ile zoom
            },
            pinch: {
              enabled: true, // Dokunmatik ekranlar için pinch zoom
            },
            mode: 'xy',
          }
        }
      },
      scales: {
          // GÜNCELLEME: Dikey (Y) eksen stilleri
          y: { 
            title: { display: true, text: 'Kayıp Değeri (Loss)', color: 'var(--text-color-darker)' }, 
            beginAtZero: false, 
            ticks: { color: 'var(--text-color-darker)' }, // Yazı rengi
            grid: { color: 'var(--border-color)' }      // Izgara rengi
          }, 
          // GÜNCELLEME: Yatay (X) eksen stilleri
          x: { 
            title: { display: true, text: 'Epoch', color: 'var(--text-color-darker)' }, 
            ticks: { color: 'var(--text-color-darker)', autoSkip: true, maxTicksLimit: 20 }, // Yazı rengi
            grid: { display: false } // Dikey ızgaraları kapat
          } 
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
            {/* YENİ: Kullanıcıya zoom özelliğini nasıl kullanacağını söyleyen ipucu */}
            <p className="chart-instructions">
              Yakınlaştırmak için fare tekerleğini kullanın. Sıfırlamak için çift tıklayın. Kaydırmak için <strong>Alt + Sürükle</strong>.
            </p>
          </div>

          <h4 className="section-title">Özet Tablosu</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Deney ID</th><th>Ticker</th><th>Epochs</th><th>LR</th><th>Final Kayıp</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp, i) => (
                  <tr key={exp.experiment_id}>
                    <td><span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>{exp.experiment_id.slice(0, 18)}...</td>
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