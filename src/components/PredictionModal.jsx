// dashboard/src/components/PredictionModal.jsx
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
  // Yeni state: Tahmin adımı sayısı
  const [predictionSteps, setPredictionSteps] = useState(model.pipeline_name.includes('stock') ? 5 : 24); // Varsayılanı pipeline türüne göre ayarla
  const { theme } = useContext(ThemeContext);

  const isTimeSeries = model.pipeline_name.includes('forecaster') || model.pipeline_name.includes('predictor');

  const handlePredict = async () => {
    setIsLoading(true);
    setPredictionResult(null);
    try {
      const payload = isTimeSeries ? { prediction_steps: predictionSteps } : { data: [] }; // prediction_steps gönder
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
  }, [model.experiment_id, predictionSteps]); // predictionSteps değişince de tahmin yap

  const { chartData, chartOptions, hasChartData } = useMemo(() => {
    // === KRİTİK DÜZELTME: Verinin varlığını ve geçerliliğini kontrol et ===
    if (!predictionResult || !isTimeSeries || 
        !predictionResult.actual_history || typeof predictionResult.actual_history !== 'object' || Object.keys(predictionResult.actual_history).length === 0) {
      return { chartData: null, chartOptions: null, hasChartData: false };
    }
  
    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
  
    const actualHistoryEntries = Object.entries(predictionResult.actual_history);
    actualHistoryEntries.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    const forecastedSeriesEntries = predictionResult.forecasted_series 
      ? Object.entries(predictionResult.forecasted_series) 
      : [];
    forecastedSeriesEntries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    
    // Geçmiş verinin son noktasını al
    const lastActualPoint = actualHistoryEntries[actualHistoryEntries.length - 1];

    const data = {
      datasets: [
        {
          label: 'Geçmiş Veri',
          data: actualHistoryEntries.map(([dateStr, value]) => ({ x: new Date(dateStr).getTime(), y: value })),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.2,
          fill: true,
          pointRadius: 1, 
          pointHoverRadius: 4,
        },
        // Tahmin çizgisi: geçmiş verinin sonundan başlayıp tahmin serisine bağlanacak
        {
          label: 'Tahmin',
          data: [
            { x: new Date(lastActualPoint[0]).getTime(), y: lastActualPoint[1] }, // Geçmişin son noktası
            ...forecastedSeriesEntries.map(([dateStr, value]) => ({ x: new Date(dateStr).getTime(), y: value })) // Tahmin edilen noktalar
          ],
          borderColor: '#22c55e',
          pointRadius: 6, 
          pointBackgroundColor: '#22c55e',
          borderWidth: 3,
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
                const date = new Date(tooltipItems[0].parsed.x);
                return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              },
              label: function(tooltipItem) {
                const datasetLabel = tooltipItem.dataset.label || '';
                const value = typeof tooltipItem.parsed.y === 'number' ? tooltipItem.parsed.y.toFixed(4) : tooltipItem.parsed.y;
                return `${datasetLabel}: ${value}`;
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
            time: { unit: 'hour', tooltipFormat: 'PPp', displayFormats: { hour: 'MMM d, HH:mm' } }, // Daha detaylı zaman birimi
            grid: { display: false }, 
            ticks: { color: textColor, font: { size: 10 }, maxRotation: 0, autoSkip: true, padding: 10 } 
        }
      }
    };
  
    return { chartData: data, chartOptions: options, hasChartData: true };
  
  }, [predictionResult, isTimeSeries, theme]);

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

          {!isLoading && predictionResult && (
            <div className={styles.resultContainer}>
              <div className={styles.resultHeader}>
                <p>Modelin Tahmini ({predictionResult.target_col || 'Değer'})</p>
                <div className={styles.predictionValue}>
                  {predictionResult.prediction.toFixed(4)}
                </div>
              </div>

              {isTimeSeries && (
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="prediction-steps">Tahmin Uzunluğu ({model.pipeline_name.includes('stock') ? 'Gün' : 'Saat'})</label>
                  <input
                    type="number"
                    id="prediction-steps"
                    value={predictionSteps}
                    onChange={(e) => setPredictionSteps(Number(e.target.value))}
                    min="1"
                    max={model.pipeline_name.includes('stock') ? 30 : 168} // Maksimum tahmin uzunluğu ayarla
                    disabled={isLoading}
                    style={{ width: '150px' }}
                  />
                  <small className={styles.helpText}>Gelecek kaç adım tahmin edilecek.</small>
                </div>
              )}

              <div className={styles.chartContainer}>
                {hasChartData ? (
                  <Line options={chartOptions} data={chartData} />
                ) : (
                  <div className={styles.noChartData}>
                    <p>Grafik için geçmiş veya tahmin verisi bulunamadı.</p>
                    <span>Bu, genellikle anlık olarak üretilen veya zaman serisi olmayan modeller için normal bir durumdur.</span>
                  </div>
                )}
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