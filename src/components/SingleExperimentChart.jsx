// dashboard/src/components/SingleExperimentChart.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react'; 
import PropTypes from 'prop-types'; 
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, Filler, TimeScale 
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom'; 
import { getCssVar } from '../utils/cssUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale, zoomPlugin);

const getChartOptions = (title, chartColors, isTimeScale = false, enableZoom = false, compactMode = false) => {
  const options = {
    responsive: true, 
    maintainAspectRatio: false,
    animation: { duration: 300, easing: 'linear' },
    plugins: { 
      legend: { display: compactMode ? false : true, position: 'top', labels: { font: { size: compactMode ? 8 : 10, color: chartColors.textColor } } },
      title: { display: compactMode ? false : true, text: title, font: { size: compactMode ? 10 : 14, color: chartColors.textColor } },
      tooltip: {
        enabled: true, backgroundColor: chartColors.contentBg,
        titleColor: chartColors.textColor, bodyColor: chartColors.textColor,
        borderColor: chartColors.border, borderWidth: 1, padding: 5, 
        displayColors: true,
        bodyFont: { size: compactMode ? 9 : 12 }, 
        titleFont: { size: compactMode ? 9 : 12 },
        callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(4) : ctx.parsed.y}`,
        }
      },
      zoom: {
        pan: { enabled: enableZoom, mode: 'x', modifierKey: 'alt', }, 
        zoom: { wheel: { enabled: enableZoom }, pinch: { enabled: true }, mode: 'x' }, 
        onZoomComplete: ({chart}) => { 
          if (chart.options.plugins.zoom.enabled) {
            if (chart.resetZoom) chart.resetZoom();
          }
        },
      }
    },
    scales: { 
      y: { 
        grid: { color: chartColors.border, borderDash: [2, 4], drawTicks: false },
        ticks: { display: compactMode ? false : true, padding: 5, maxTicksLimit: compactMode ? 2 : 5, font: { size: compactMode ? 8 : 10, color: chartColors.textColorDarker } },
        beginAtZero: false, 
      }, 
      x: {
        grid: { display: false },
        ticks: { display: compactMode ? false : true, padding: 5, maxRotation: 0, autoSkip: true, maxTicksLimit: compactMode ? 3 : 7, font: { size: compactMode ? 8 : 10, color: chartColors.textColorDarker } },
      } 
    },
    layout: {
      padding: {
        left: compactMode ? 5 : 10, right: compactMode ? 5 : 10, top: compactMode ? 0 : 5, bottom: compactMode ? 0 : 5
      }
    }
  };

  if (isTimeScale) {
    options.scales.x = { 
      type: 'time', 
      time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' }, 
      ticks: { font: { size: compactMode ? 8 : 10, color: chartColors.textColorDarker } } 
    };
  }

  return options;
};


function SingleExperimentChart({ 
  taskId, 
  mode, 
  chartType, 
  reportData, 
}) {
  const [liveData, setLiveData] = useState({
    loss: [],
    prediction: { x_axis: [], y_true: [], y_pred: [] }
  });

  const chartRef = useRef(null); 

  const chartColors = useMemo(() => ({
    primary: getCssVar('--primary-color'),
    info: getCssVar('--info-color'), 
    error: getCssVar('--error-color'), 
    border: getCssVar('--border-color'),
    textColor: getCssVar('--text-color'),
    textColorDarker: getCssVar('--text-color-darker'),
    contentBg: getCssVar('--content-bg'),
    textInverse: getCssVar('--text-inverse'),
  }), []);

  useEffect(() => {
    let socket;
    if (mode === 'live' && taskId) {
        socket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.state === 'PROGRESS' && data.details) {
                setLiveData(prev => {
                    let updatedLoss = [...prev.loss];
                    let updatedPrediction = { ...prev.prediction };

                    // Kayıp verisini güncelleme
                    if (data.details.loss !== undefined) {
                        const newLoss = data.details.loss;
                        const newEpoch = data.details.epoch;
                        if (newEpoch > updatedLoss.length) { 
                            updatedLoss.push(newLoss);
                        } else if (newEpoch -1 >= 0 && newEpoch -1 < updatedLoss.length) { 
                            updatedLoss[newEpoch -1] = newLoss;
                        } else { 
                            updatedLoss.push(newLoss);
                        }
                    }

                    // Tahmin verisini güncelleme (sadece validation_data varsa ve geçerliyse)
                    if (data.details.validation_data && Array.isArray(data.details.validation_data.x_axis) && data.details.validation_data.x_axis.length > 0) {
                        // KRİTİK DÜZELTME: Tahmin grafiği verilerini doğrudan buradan al ve kullan.
                        // Tahmin grafiği için X ekseni ve Y değerlerinin Date objeleri olarak parse edilmesi
                        // Chart.js TimeScale için önemlidir.
                        updatedPrediction = {
                            x_axis: data.details.validation_data.x_axis, // ISO string olarak geliyor
                            y_true: data.details.validation_data.y_true,
                            y_pred: data.details.validation_data.y_pred,
                        };
                    }
                    
                    // console.log("LIVE DATA UPDATE:", { updatedLoss, updatedPrediction }); 
                    return { loss: updatedLoss, prediction: updatedPrediction };
                });
            } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
                setLiveData({
                    loss: data.result?.results?.history?.loss || [],
                    prediction: {
                        x_axis: data.result?.results?.time_index || [],
                        y_true: data.result?.results?.y_true || [],
                        y_pred: data.result?.results?.y_pred || [],
                    }
                });
            }
        };
        
        socket.onerror = (err) => { console.error(`WebSocket Error for task ${taskId}:`, err); };
        socket.onclose = () => {}; 
        return () => { 
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close(1000, "Component unmounting or task finished"); 
            }
        };
    }
}, [mode, taskId]); 

  // Hangi veriyi kullanacağımızı belirle (liveData veya reportData)
  const currentLossHistory = mode === 'live' ? liveData.loss : reportData?.history?.loss || [];
  const currentPredictionXAxis = mode === 'live' ? liveData.prediction.x_axis : reportData?.time_index || [];
  const currentPredictionYTrue = mode === 'live' ? liveData.prediction.y_true : reportData?.y_true || [];
  const currentPredictionYPred = mode === 'live' ? liveData.prediction.y_pred : reportData?.y_pred || [];


  const chartData = useMemo(() => {
    if (chartType === 'loss') {
      return {
        labels: currentLossHistory.map((_, i) => `E${i + 1}`),
        datasets: [{
          label: 'Eğitim Kaybı',
          data: currentLossHistory,
          borderColor: chartColors.primary,
          backgroundColor: `color-mix(in srgb, ${chartColors.primary} 20%, transparent)`,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: 'origin',
        }]
      };
    } else if (chartType === 'prediction') {
      // Tahmin grafiği için: x_axis'i tarih olarak kullanıyoruz, y_true ve y_pred değerleri
      return {
        // labels: currentPredictionXAxis, // TimeScale'da labels yerine doğrudan data objelerinde x değeri kullanılır.
        datasets: [
          {
            label: 'Gerçek', 
            data: currentPredictionYTrue,
            borderColor: chartColors.info,
            backgroundColor: `color-mix(in srgb, ${chartColors.info} 20%, transparent)`,
            pointRadius: 0,
            fill: false, 
          },
          {
            label: 'Tahmin', 
            data: currentPredictionYPred,
            borderColor: chartColors.error,
            borderDash: [5, 5], 
            pointRadius: 0,
            fill: false
          }
        ].map(dataset => ({
            ...dataset,
            // KRİTİK DÜZELTME: x_axis'ten gelen ISO string'leri Date objesine dönüştürüyoruz.
            // Chart.js TimeScale, Date objelerini daha güvenilir bir şekilde işler.
            data: dataset.data.map((val, i) => ({ x: new Date(currentPredictionXAxis[i]), y: val }))
        }))
      };
    }
    return { labels: [], datasets: [] };
  }, [chartType, currentLossHistory, currentPredictionXAxis, currentPredictionYTrue, currentPredictionYPred, chartColors]);

  const chartTitle = chartType === 'loss' ? 'Kayıp' : 'Tahmin'; 

  const hasData = chartType === 'loss' ? currentLossHistory.length > 0 : currentPredictionYTrue.length > 0;

  return (
    <div className="single-chart-container">
      {hasData ? (
        <Line 
          ref={chartRef} 
          data={chartData} 
          options={getChartOptions(
            chartTitle, 
            chartColors, 
            chartType === 'prediction', // prediction grafiği için isTimeScale = true
            chartType === 'prediction' && mode === 'report', // sadece report modunda zoom etkin
            true // compact mode
          )} 
        />
      ) : (
        <div className="no-chart-data-message">
          {mode === 'live' ? 'Canlı veri bekleniyor...' : 'Veri mevcut değil.'}
        </div>
      )}
      {(chartType === 'prediction' && mode === 'report') && ( 
            <p className="chart-instructions">Yakınlaştırmak için fare tekerleği, kaydırmak için Alt + Sürükle.</p>
        )}
    </div>
  );
}

export default React.memo(SingleExperimentChart);