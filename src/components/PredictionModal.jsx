// ========== DOSYA: dashboard/src/components/PredictionModal.jsx ==========
import React, { useState, useMemo, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale } from 'chart.js';
import { de } from 'date-fns/locale'; // Sadece adapter için gerekli
import 'chartjs-adapter-date-fns';

import { predictFromExperiment } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { ThemeContext } from '../context/ThemeContext';
import LoadingSpinner from './LoadingSpinner';

// Chart.js bileşenlerini ve zaman adaptörünü kaydet
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale);

function PredictionModal({ model, onClose }) {
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);

  const isTimeSeries = model.pipeline_name.includes('forecaster') || model.pipeline_name.includes('predictor');

  const handlePredict = async () => {
    setIsLoading(true);
    setPredictionResult(null); // Yeni tahmin için eski sonucu temizle
    try {
      // Zaman serisi modelleri için payload boş gönderilir, worker en son veriyi kullanır.
      const payload = isTimeSeries ? {} : { data: [] };
      const response = await predictFromExperiment(model.experiment_id, payload);
      setPredictionResult(response.data);
    } catch (error) {
      handleApiError(error, "tahmin yapma");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modal ilk açıldığında tahmini otomatik başlat
  useEffect(() => {
    handlePredict();
  }, [model.experiment_id]); // Sadece model değiştiğinde tekrar çalışır

  const { chartData, chartOptions } = useMemo(() => {
    if (!predictionResult || !predictionResult.history) return { chartData: null, chartOptions: null };

    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    
    // === GRAFİK MANTIĞI DÜZELTMESİ: Gerçek zaman serisi verisi kullanımı ===
    const historyEntries = Object.entries(predictionResult.history);
    const MAX_POINTS = 50;
    const displayHistory = historyEntries.slice(-MAX_POINTS);
    
    if (displayHistory.length === 0) return { chartData: null, chartOptions: null };

    const lastHistoryEntry = displayHistory[displayHistory.length - 1];
    const lastDate = new Date(lastHistoryEntry[0]);
    // Veri aralığını hesapla (varsayılan 1 gün)
    const interval = displayHistory.length > 1 
      ? new Date(displayHistory[1][0]).getTime() - new Date(displayHistory[0][0]).getTime()
      : 24 * 60 * 60 * 1000;
      
    const predictionDate = new Date(lastDate.getTime() + interval);
    
    const data = {
      datasets: [
        {
          label: 'Geçmiş Veri',
          data: displayHistory.map(([dateStr, value]) => ({ x: new Date(dateStr).getTime(), y: value })),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.2,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'Tahmin',
          data: [
            { x: lastDate.getTime(), y: lastHistoryEntry[1] },
            { x: predictionDate.getTime(), y: predictionResult.prediction }
          ],
          borderColor: '#22c55e',
          pointRadius: 5,
          pointBackgroundColor: '#22c55e',
          borderWidth: 2,
          type: 'line',
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: true, position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 15 } },
        tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
        }
      },
      scales: {
        y: { 
            grid: { color: gridColor, borderDash: [2, 4] }, 
            ticks: { color: textColor, padding: 10 } 
        },
        x: { 
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'PP', displayFormats: { day: 'MMM d' } },
            grid: { display: false }, 
            ticks: { color: textColor, font: { size: 10 }, maxRotation: 0, autoSkip: true } 
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
          {isLoading && <LoadingSpinner message="Tahmin hesaplanıyor..." />}
          
          {!isLoading && !predictionResult && (
             <p className={styles.infoText}>
                <b>{model.pipeline_name}</b> modeli için tahmin sonucu alınamadı.
             </p>
          )}

          {!isLoading && predictionResult && chartData && (
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
          <button className={styles.buttonSecondary} onClick={onClose} disabled={isLoading}>Kapat</button>
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