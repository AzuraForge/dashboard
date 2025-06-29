import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ label: 'Loss', data: [] }] });
  const ws = useRef(null);

  // chartOptions sadeleştirildi. Renkler globalden geliyor.
  const chartOptions = {
    animation: false, responsive: true, maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        enabled: true,
        backgroundColor: 'var(--content-bg)',
        borderColor: 'var(--border-color)',
      } 
    },
    scales: { 
        y: { 
          beginAtZero: false, 
          ticks: { maxTicksLimit: 5 },
        }, 
        x: { 
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }, 
        } 
    }
  };

  useEffect(() => {
    if (!taskId) return;
    setStatusData({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setChartData({
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [],
        borderColor: 'var(--primary-color)', 
        backgroundColor: 'rgba(66, 185, 131, 0.2)',
        tension: 0.1, fill: true,
        pointRadius: 2,
      }]
    });
    
    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log(`WebSocket connected for task ${taskId}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusData(data);
      
      const updateChart = (newLoss, newEpoch) => {
        setChartData(prev => {
            const epochLabel = `E${newEpoch}`;
            const newLabels = [...prev.labels, epochLabel].slice(-50);
            const newData = [...prev.datasets[0].data, newLoss].slice(-50);

            if (!prev.labels.includes(epochLabel)) {
                return {
                    labels: newLabels,
                    datasets: [{ ...prev.datasets[0], data: newData }]
                };
            }
            return prev;
        });
      };
      
      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        updateChart(data.details.loss, data.details.epoch);
      } else if (data.ready || data.state === 'SUCCESS' || data.state === 'FAILURE') {
        const finalResult = data.result || {};
        if (finalResult.results?.loss && Array.isArray(finalResult.results.loss)) {
            const losses = finalResult.results.loss;
            const labels = Array.from({ length: losses.length }, (_, i) => `E${i + 1}`);
            setChartData({ labels: labels.slice(-50), datasets: [{...chartData.datasets[0], data: losses.slice(-50) }]});
        }
        if (ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
        }
      }
    };

    ws.current.onerror = () => {
        setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    };
    
    ws.current.onclose = () => {
      setStatusData(prev => {
        if (prev?.state === 'SUCCESS' || prev?.state === 'FAILURE' || prev?.state === 'ERROR') return prev;
        return { ...prev, state: 'DISCONNECTED', details: { status_text: `Bağlantı kesildi.` } };
      });
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [taskId]);
  
  const { state, details, result } = statusData;
  const config = details?.config || result?.config || {};
  const pipelineName = config.pipeline_name || '';
  const ticker = config.data_sourcing?.ticker || '';
  
  let currentLoss = 'N/A';
  if (state === 'PROGRESS' && details?.loss !== undefined) {
    currentLoss = details.loss.toFixed(6);
  } else if (state === 'SUCCESS' || state === 'FAILURE') {
    const finalResult = result?.results || {};
    const finalLoss = finalResult.final_loss ?? (finalResult.loss?.[finalResult.loss.length - 1]);
    currentLoss = finalLoss !== undefined ? finalLoss.toFixed(6) : (state === 'FAILURE' ? 'Hata!' : 'N/A');
  }

  let progressPercent = 0;
  if (state === 'SUCCESS') progressPercent = 100;
  else if (details?.total_epochs) progressPercent = ((details.epoch || 0) / details.total_epochs) * 100;

  let statusText = 'İlerleme durumu bekleniyor...';
  if (state === 'SUCCESS') statusText = 'Eğitim başarıyla tamamlandı!';
  else if (details?.status_text) statusText = details.status_text;
  
  return (
    <div className="live-tracker-pane">
      <button className="close-button" onClick={onClose} aria-label="Kapat">×</button>
      <div className="tracker-header">
        <h4><span role="img" aria-label="satellite">🛰️</span> Canlı Takip: {pipelineName || "Yükleniyor..."} {ticker && `(${ticker})`}</h4>
        <div className="tracker-info">
            <span className="exp-id">ID: {taskId}</span>
            <span className={`status-badge status-${state?.toLowerCase()}`}>{state || 'Bilinmiyor'}</span>
        </div>
      </div>
      
      <div className="tracker-body">
        <div className="tracker-progress">
          <p>{statusText}</p>
          <progress value={progressPercent} max="100" style={{width: '100%'}}></progress>
          <p style={{marginTop: '10px'}}>Mevcut Kayıp: <strong>{currentLoss}</strong></p>
        </div>
        <div className="tracker-chart">
          {chartData.labels.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : <div className="chart-placeholder">Grafik verisi bekleniyor...</div>}
        </div>
      </div>
      {state === 'FAILURE' && <p className="feedback error" style={{marginTop: '15px'}}>{result?.error_message || 'Bilinmeyen bir hata oluştu.'}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = {
  taskId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LiveTrackerPane;