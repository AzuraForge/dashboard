import React, { useState, useMemo, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

import { predictFromExperiment } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { ThemeContext } from '../context/ThemeContext';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale);

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
      const response = await predictFromExperiment(model.experiment_id, payload);
      setPredictionResult(response.data);
    } catch (error) {
      handleApiError(error, "tahmin yapma");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    handlePredict();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.experiment_id]);

  const { chartData, chartOptions } = useMemo(() => {
    // Eğer sonuç yoksa veya sonuç içinde geçmiş veri yoksa, boş obje dön.
    if (!predictionResult || !predictionResult.history) {
      return { chartData: null, chartOptions: null };
    }
  
    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
  
    // --- GRAFİK MANTIĞI DÜZELTMESİ: API'den gelen gerçek tarihleri kullan ---
    
    // 1. API'den gelen history objesini [tarih, değer] dizisine çevir.
    const historyEntries = Object.entries(predictionResult.history);
    
    // 2. Bu diziyi tarihe göre sırala (her ihtimale karşı).
    historyEntries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
  
    // 3. Geçmiş verinin son noktasını ve tarihini al.
    const lastHistoryEntry = historyEntries[historyEntries.length - 1];
    const lastDate = new Date(lastHistoryEntry[0]);
    
    // 4. Tahmin için bir sonraki zaman adımını hesapla.
    // İki nokta arasındaki zaman farkını kullanarak bir sonraki adımı tahmin et.
    const interval = historyEntries.length > 1 
      ? new Date(historyEntries[1][0]).getTime() - new Date(historyEntries[0][0]).getTime()
      : 24 * 60 * 60 * 1000; // Varsayılan olarak 1 gün ekle.
      
    const predictionDate = new Date(lastDate.getTime() + interval);
    
    const data = {
      datasets: [
        {
          label: 'Geçmiş Veri',
          // API'den gelen her bir [tarih, değer] çiftini Chart.js formatına çevir.
          data: historyEntries.map(([dateStr, value]) => ({ x: new Date(dateStr).getTime(), y: value })),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.2,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'Tahmin',
          // Tahmin çizgisini, geçmişin son noktasından tahmin edilen noktaya çiz.
          data: [
            { x: lastDate.getTime(), y: lastHistoryEntry[1] },
            { x: predictionDate.getTime(), y: predictionResult.prediction }
          ],
          borderColor: '#22c55e',
          pointRadius: 5,
          pointBackgroundColor: '#22c55e',
          borderWidth: 3, // Daha belirgin hale getirildi
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
            callbacks: {
              title: function(tooltipItems) {
                // Tooltip başlığında tarihi daha okunabilir formatta göster
                const date = new Date(tooltipItems[0].parsed.x);
                return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
              }
            }
        }
      },
      scales: {
        y: { 
            grid: { color: gridColor, borderDash: [2, 4] }, 
            ticks: { color: textColor, padding: 10 } 
        },
        x: { 
            type: 'time',
            // Zaman ekseninin nasıl gösterileceğini ayarla
            time: { unit: 'day', tooltipFormat: 'PPp', displayFormats: { day: 'd MMM' } },
            grid: { display: false }, 
            ticks: { color: textColor, font: { size: 10 }, maxRotation: 0, autoSkip: true, padding: 10 } 
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
             <div className="card" style={{ textAlign: 'center', padding: '2rem', borderStyle: 'dashed' }}>
                <p><b>{model.pipeline_name}</b> modeli için tahmin sonucu alınamadı.</p>
             </div>
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
          <button className="button-secondary" onClick={onClose} disabled={isLoading}>Kapat</button>
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