// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentCard.jsx ==========
// Not: Bu kart artık kendi WebSocket bağlantısını kurmayacak.
// DashboardOverview'dan düzenli olarak güncel veriyi alacak.
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2'; 

// Chart.js bileşenlerini kaydet
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ExperimentCard({ experiment, onSelect }) {
  const navigate = useNavigate();
  
  // Experiment objesinden gelen verileri doğrudan kullanıyoruz
  const currentStatus = experiment.status;
  const finalLoss = experiment.final_loss; // final_loss zaten güncel veri olarak gelecek
  const pipelineConfig = experiment.config || {};
  const dataSourcing = pipelineConfig.data_sourcing || {};
  const trainingParams = pipelineConfig.training_params || {};

  let progress = 0;
  let statusText = currentStatus || "Bilgi bekleniyor...";

  // PROGRESS veya STARTED durumları için ilerlemeyi hesapla
  if (currentStatus === 'PROGRESS' && experiment.details?.total_epochs) {
    progress = ((experiment.details.epoch || 0) / experiment.details.total_epochs) * 100;
    statusText = experiment.details.status_text || `Epoch ${experiment.details.epoch}/${experiment.details.total_epochs}`;
  } else if (currentStatus === 'SUCCESS') {
    progress = 100;
    statusText = "Başarıyla Tamamlandı";
  } else if (currentStatus === 'FAILURE' || currentStatus === 'ERROR') {
    progress = 0;
    statusText = experiment.error_message || "Hata Oluştu";
  }
  
  // Kayıp grafiği verisi
  const lossHistory = experiment.results?.loss || [];
  const chartData = {
    labels: Array.from({ length: lossHistory.length }, (_, i) => `Epoch ${i + 1}`),
    datasets: [{
      label: 'Eğitim Kaybı',
      data: lossHistory,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1,
      fill: false
    }]
  };

  const handleCardClick = () => {
    navigate(`/experiments/${experiment.id}`);
    if (onSelect) {
      onSelect(experiment.id);
    }
  };

  return (
    <div className="card experiment-card clickable" onClick={handleCardClick}>
      <h3>
        {experiment.pipeline_name || 'Bilinmeyen Pipeline'} 
        {dataSourcing.ticker && <span className="exp-id"> ({dataSourcing.ticker})</span>}
      </h3>
      <p><strong>ID:</strong> <span className="exp-id">{experiment.id}</span></p>
      <p><strong>Durum:</strong> 
        <span className={`status-badge status-${currentStatus?.toLowerCase()}`}>{currentStatus || 'Bilinmiyor'}</span>
      </p>
      
      {(currentStatus === 'STARTED' || currentStatus === 'PROGRESS') && (
        <div className="progress-section">
          <p>{statusText}</p>
          <progress value={progress} max="100"></progress>
          <p>Mevcut Kayıp: <strong>{experiment.details?.loss !== undefined && experiment.details?.loss !== null ? experiment.details.loss.toFixed(6) : (finalLoss !== undefined && finalLoss !== null ? finalLoss.toFixed(6) : 'N/A')}</strong></p>
        </div>
      )}
      {(currentStatus === 'SUCCESS' || currentStatus === 'FAILURE' || currentStatus === 'ERROR' || currentStatus === 'DISCONNECTED' || currentStatus === 'UNKNOWN') && (
        <p>Son Kayıp: <strong>{finalLoss !== undefined && finalLoss !== null ? finalLoss.toFixed(6) : 'N/A'}</strong></p>
      )}

      {/* Mini Grafik */}
      {chartData.labels.length > 0 && (
          <div className="mini-chart-container" style={{ height: '150px', width: '100%', marginTop: '15px' }}>
              <Line data={chartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, title: { display: false }, tooltip: { enabled: false } },
                  scales: {
                      x: { display: false },
                      y: { display: false, beginAtZero: false }
                  },
                  animation: false, // Canlı grafik için animasyonu kapat
                  elements: { point: { radius: 0 } } // Noktaları gizle
              }} />
          </div>
      )}
    </div>
  );
}

ExperimentCard.propTypes = {
  experiment: PropTypes.object.isRequired,
  onSelect: PropTypes.func, // Optional callback for parent component
};

export default ExperimentCard;