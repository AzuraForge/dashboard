// dashboard/src/components/LiveTrackerPane.jsx

import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { getCssVar } from '../utils/cssUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale);

const initialStatus = { 
  state: 'CONNECTING', 
  details: { status_text: 'Worker\'a bağlanılıyor...' }
};

// Grafik seçeneklerini bir yardımcı fonksiyon haline getirelim
const getChartOptions = (title) => ({
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 300, easing: 'linear' },
  plugins: { 
    legend: { display: true, position: 'top', labels: { font: { size: 10 } } },
    title: { display: true, text: title, font: { size: 14 } },
    tooltip: {
      enabled: true, backgroundColor: getCssVar('--content-bg'),
      titleColor: getCssVar('--text-color'), bodyColor: getCssVar('--text-color'),
      borderColor: getCssVar('--border-color'), borderWidth: 1, padding: 10,
    },
  },
  scales: { 
    y: { 
      grid: { color: getCssVar('--border-color'), borderDash: [2, 4], drawTicks: false },
      ticks: { padding: 10, maxTicksLimit: 5, font: { size: 10 }, color: getCssVar('--text-color-darker') },
    }, 
    x: {
      grid: { display: false },
      ticks: { padding: 10, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 10 }, color: getCssVar('--text-color-darker') },
    } 
  }
});


function LiveTrackerPane({ taskId, onClose }) {
  const [liveData, setLiveData] = useState({ 
    status: initialStatus,
    lossChart: { labels: [], datasets: [] },
    predictionChart: { labels: [], datasets: [] }
  });
  
  const lossChartOptions = useMemo(() => getChartOptions('Canlı Eğitim Kaybı'), []);
  const predictionChartOptions = useMemo(() => ({
    ...getChartOptions('Canlı Tahmin Grafiği (Doğrulama Seti)'),
    scales: {
      ...getChartOptions().scales,
      x: { 
        type: 'time', 
        time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' }, // Tarih formatı ekle
        ticks: { font: { size: 10 }, color: getCssVar('--text-color-darker') } 
      }
    },
    // YENİ: Yakınlaştırma ve Kaydırma eklentisi
    plugins: {
      ...getChartOptions().plugins,
      zoom: {
        pan: { enabled: true, mode: 'x', modifierKey: 'alt', },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
      }
    }
  }), []);


  useEffect(() => {
    if (!taskId) return;

    const primaryColor = getCssVar('--primary-color');
    const infoColor = getCssVar('--info-color');
    const errorColor = getCssVar('--error-color');

    const initialLossChart = {
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [], fill: true,
        borderColor: primaryColor,
        backgroundColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)`,
        tension: 0.4, borderWidth: 2, pointRadius: 0
      }]
    };
    const initialPredictionChart = {
      labels: [], // Zaman ekseni için label'lara gerek yok
      datasets: [
        { label: 'Gerçek Değerler', data: [], borderColor: infoColor, borderWidth: 2, pointRadius: 0, fill: false },
        { label: 'Tahminler', data: [], borderColor: errorColor, borderDash: [5, 5], borderWidth: 2, pointRadius: 0, fill: false }
      ]
    };
    
    setLiveData({ status: initialStatus, lossChart: initialLossChart, predictionChart: initialPredictionChart });

    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveData(prev => {
        let newLossChart = prev.lossChart;
        let newPredictionChart = prev.predictionChart;

        if (data.state === 'PROGRESS' && data.details) {
          // Kayıp grafiğini güncelle
          if (data.details.loss !== undefined) {
            const epochLabel = `E${data.details.epoch}`;
            // Eğer aynı epoch için birden fazla güncelleme gelirse sonuncuyu kullan
            const existingLossData = prev.lossChart.datasets[0].data;
            const lastEpoch = prev.lossChart.labels[prev.lossChart.labels.length - 1];

            // Eğer yeni epoch veya mevcut epochun yeni bir güncellemesi ise ekle/güncelle
            if (epochLabel !== lastEpoch || newLossChart.labels.length === 0) {
                 const newLabels = [...prev.lossChart.labels, epochLabel].slice(-50); // Son 50 epoch
                 const newLossData = [...existingLossData, data.details.loss].slice(-50);
                 newLossChart = { 
                     ...prev.lossChart, 
                     labels: newLabels, 
                     datasets: [{ ...prev.lossChart.datasets[0], data: newLossData }] 
                 };
            } else {
                // Mevcut epoch için sadece loss'u güncelle
                const updatedLossData = [...existingLossData];
                updatedLossData[updatedLossData.length - 1] = data.details.loss;
                newLossChart = {
                    ...prev.lossChart,
                    datasets: [{ ...prev.lossChart.datasets[0], data: updatedLossData }]
                };
            }
          }

          // Tahmin grafiğini güncelle
          if (data.details.validation_data) {
            const { x_axis, y_true, y_pred } = data.details.validation_data;
            newPredictionChart = {
              ...prev.predictionChart,
              datasets: [
                { ...prev.predictionChart.datasets[0], data: y_true.map((val, i) => ({ x: x_axis[i], y: val })) },
                { ...prev.predictionChart.datasets[1], data: y_pred.map((val, i) => ({ x: x_axis[i], y: val })) },
              ]
            };
          }
        }
        return { status: data, lossChart: newLossChart, predictionChart: newPredictionChart };
      });
    };
    
    socket.onerror = () => setLiveData(prev => ({ ...prev, status: { state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } }}));
    socket.onclose = () => setLiveData(prev => (['SUCCESS', 'FAILURE', 'ERROR'].includes(prev.status.state)) ? prev : { ...prev, status: { ...prev.status, state: 'DISCONNECTED' }});
    
    return () => { if (socket.readyState === 1) socket.close(1000, "Component unmounting"); };
  }, [taskId]);
  
  const { state, details, result } = liveData.status;
  const pipeline_name = details?.pipeline_name || result?.config?.pipeline_name || "Bilinmiyor";
  const { total_epochs, epoch, status_text } = details || {};
  const progressPercent = (state === 'SUCCESS' || state === 'FAILURE') ? 100 : (total_epochs && epoch ? (epoch / total_epochs) * 100 : 0);
  
  return (
    <div className="live-tracker-pane">
      <button className="close-button" onClick={onClose}>×</button>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
        <h4><span role="img" aria-label="satellite">🛰️</span> Canlı Takip: {pipeline_name}</h4>
        <span className={`status-badge status-${state?.toLowerCase()}`}>{state}</span>
      </div>
      <div style={{display: 'flex', gap: '20px', alignItems: 'stretch', height: '250px'}}> {/* Yüksekliği artırıldı */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <p style={{ margin: 0, color: 'var(--text-color-darker)', fontSize: '0.9em' }}>{status_text || state}</p>
                {epoch && total_epochs && (
                    <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{epoch} / {total_epochs}</span>
                )}
            </div>
            <progress value={progressPercent} max="100" style={{width: '100%', height: '10px'}}></progress>
            <div style={{flex: 1, position: 'relative', marginTop: '10px'}}>
              <Line data={liveData.lossChart} options={lossChartOptions} />
              <p className="chart-instructions" style={{bottom: '0'}}>Epoch ilerlemesi</p>
            </div>
        </div>
        <div style={{flex: 2, position: 'relative'}}>
          {liveData.predictionChart.datasets[0]?.data.length > 0 ? (
            <Line data={liveData.predictionChart} options={predictionChartOptions} />
          ) : (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-color-darker)'}}>Tahmin verisi bekleniyor...</div>
          )}
          <p className="chart-instructions" style={{bottom: '0'}}>Yakınlaştırmak için fare tekerleği, kaydırmak için Alt+Sürükle</p>
        </div>
      </div>
      {state === 'FAILURE' && result?.error && <p style={{marginTop: '15px', color: 'var(--error-color)'}}>{result.error.message}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = { 
  taskId: PropTypes.string.isRequired, 
  onClose: PropTypes.func.isRequired, 
};

export default LiveTrackerPane;