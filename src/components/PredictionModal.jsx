import React, { useState, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// === DEĞİŞİKLİK: Axios import'u kaldırıldı, merkezi API fonksiyonu import edildi ===
import { predictFromExperiment } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { ThemeContext } from '../context/ThemeContext';

// Chart.js bileşenlerini kaydet
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function PredictionModal({ model, onClose }) {
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);

  const isTimeSeries = model.pipeline_name.includes('forecaster') || model.pipeline_name.includes('predictor');

  const handlePredict = async () => {
    setIsLoading(true);
    setPredictionResult(null);
    try {
      const payload = isTimeSeries ? {} : { data: [] };
      // === DEĞİŞİKLİK: Artık merkezi API fonksiyonunu kullanıyoruz ===
      // Authorization başlığı ve URL, `api.js` içindeki `apiClient` tarafından yönetiliyor.
      const response = await predictFromExperiment(model.experiment_id, payload);
      setPredictionResult(response.data);
    } catch (error) {
      handleApiError(error, "tahmin yapma");
    } finally {
      setIsLoading(false);
    }
  };

  const { chartData, chartOptions } = useMemo(() => {
    if (!predictionResult || !predictionResult.history) return { chartData: null, chartOptions: null };

    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const historyValues = Object.values(predictionResult.history);
    
    // Geçmiş verinin son 30 noktasını alarak grafiği daha okunabilir yapalım
    const displayHistory = historyValues.slice(-30);
    const labels = Array.from({ length: displayHistory.length }, (_, i) => `T-${displayHistory.length - i}`);
    labels.push("Tahmin");

    const data = {
      labels,
      datasets: [
        {
          label: 'Geçmiş Veri',
          data: displayHistory,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.2,
          fill: true,
        },
        {
          label: 'Tahmin',
          // Grafiğin son geçmiş noktası ile tahmin noktasını birleştiren bir çizgi çiz
          data: [...Array(displayHistory.length - 1).fill(null), displayHistory[displayHistory.length - 1], predictionResult.prediction],
          borderColor: '#22c55e',
          pointRadius: 5,
          pointBackgroundColor: '#22c55e',
          type: 'line',
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y.toFixed(4);
                    }
                    return label;
                }
            }
        }
      },
      scales: {
        y: { 
            grid: { color: gridColor, borderDash: [2, 4], drawTicks: false }, 
            ticks: { color: textColor, padding: 10 } 
        },
        x: { 
            grid: { display: false }, 
            ticks: { color: textColor, font: { size: 10 } } 
        }
      }
    };

    return { chartData: data, chartOptions: options };
  }, [predictionResult, theme]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Anlık Tahmin</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>
        <div className={styles.body}>
          {!predictionResult && (
            <>
              <p>
                <b>{model.pipeline_name}</b> modeli, eğitimde kullanılan verilerin sonunu baz alarak bir sonraki zaman adımını otomatik olarak tahmin edecektir.
                <br/><br/>Devam etmek için "Tahmin Et" butonuna tıklayın.
              </p>
              {isLoading && <p className={styles.loadingText}>Tahmin yapılıyor...</p>}
            </>
          )}
          
          {predictionResult && chartData && (
            <div className={styles.resultContainer}>
              <div className={styles.resultHeader}>
                <p>Modelin Tahmini ({predictionResult.target_col || 'Değer'})</p>
                <div className={styles.predictionValue}>
                  {predictionResult.prediction.toFixed(4)}
                </div>
              </div>
              <div className={styles.chartContainer}>
                <Line options={chartOptions} data={chartData} />
              </div>
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <button className={styles.buttonSecondary} onClick={onClose} disabled={isLoading}>İptal</button>
          <button className="button-primary" onClick={handlePredict} disabled={isLoading || !isTimeSeries}>
            {isLoading ? 'Hesaplanıyor...' : 'Yeniden Tahmin Et'}
          </button>
        </footer>
      </div>
    </div>
  );
}

PredictionModal.propTypes = {
  model: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PredictionModal;