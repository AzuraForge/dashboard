import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function LiveTrackerPane({ taskId, onClose }) {
  const [status, setStatus] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ label: 'Loss', data: [] }] });
  const [currentLoss, setCurrentLoss] = useState('N/A');
  const [pipelineName, setPipelineName] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    if (!taskId) return;

    // Her yeni taskId geldiğinde durumu ve grafiği sıfırla
    setStatus({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setCurrentLoss('N/A');
    setChartData({
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [],
        borderColor: '#42b983', backgroundColor: 'rgba(66, 185, 131, 0.5)',
        tension: 0.1, fill: false
      }]
    });

    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setStatus({ state: 'CONNECTED', details: { status_text: 'Bağlantı kuruldu, veri bekleniyor...' } });

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);
      setPipelineName(data.details?.config?.pipeline_name || pipelineName);

      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setCurrentLoss(data.details.loss.toFixed(6));
        setChartData(prev => {
          const epoch = data.details.epoch;
          if (!prev.labels.includes(`E${epoch}`)) {
            return {
              labels: [...prev.labels, `E${epoch}`],
              datasets: [{ ...prev.datasets[0], data: [...prev.datasets[0].data, data.details.loss] }]
            };
          }
          return prev;
        });
      } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
        const finalLoss = data.result?.final_loss ?? (data.result?.loss?.[data.result.loss.length - 1]);
        setCurrentLoss(finalLoss !== undefined ? finalLoss.toFixed(6) : 'Hata!');
        if (ws.current) ws.current.close();
      }
    };

    ws.current.onerror = () => setStatus({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    ws.current.onclose = () => {
      setStatus(prev => {
        if (prev?.state === 'SUCCESS' || prev?.state === 'FAILURE' || prev?.state === 'ERROR') return prev;
        return { ...prev, state: 'DISCONNECTED', details: { ...prev?.details, status_text: `Bağlantı kesildi. Son durum: ${prev?.state}` } };
      });
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [taskId]); // Sadece taskId değiştiğinde yeniden bağlan

  const progressPercent = status?.details?.total_epochs
    ? ((status.details.epoch || 0) / status.details.total_epochs) * 100
    : (status?.state === 'SUCCESS' ? 100 : 0);

  return (
    <div className="live-tracker-pane card">
      <button className="close-button" onClick={onClose}>×</button>
      <div className="tracker-header">
        <h4><span role="img" aria-label="satellite">🛰️</span> Canlı Deney Takibi: {pipelineName || 'Yükleniyor...'}</h4>
        <div className="tracker-info">
            <span className="exp-id">ID: {taskId}</span>
            <span className={`status-badge status-${status?.state?.toLowerCase()}`}>{status?.state || 'Bilinmiyor'}</span>
        </div>
      </div>
      
      <div className="tracker-body">
        <div className="tracker-progress">
          <p>{status?.details?.status_text || 'İlerleme durumu bekleniyor...'}</p>
          <progress value={progressPercent} max="100"></progress>
          <p>Mevcut Kayıp (Loss): <strong>{currentLoss}</strong></p>
        </div>
        <div className="tracker-chart">
          {chartData.labels.length > 0 ? (
            <Line data={chartData} options={{
              animation: false, responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: false }, x: { ticks: { maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 10 } } }
            }} />
          ) : <div className="chart-placeholder">Grafik verisi bekleniyor...</div>}
        </div>
      </div>

      {status?.state === 'FAILURE' && <p className="feedback error">{status?.details?.error_message}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = {
  taskId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LiveTrackerPane;