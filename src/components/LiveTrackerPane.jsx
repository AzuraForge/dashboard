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
  const [ticker, setTicker] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    if (!taskId) return;

    setStatus({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setCurrentLoss('N/A');
    setPipelineName('');
    setTicker('');
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

    ws.current.onopen = () => console.log(`WebSocket connected for task ${taskId}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);

      const config = data.details?.config || data.result?.config || {};
      setPipelineName(config.pipeline_name || pipelineName);
      setTicker(config.data_sourcing?.ticker || ticker);
      
      const updateChart = (newLoss, newEpoch) => {
        setChartData(prev => {
            const epochLabel = `E${newEpoch}`;
            if (!prev.labels.includes(epochLabel)) {
                return {
                    labels: [...prev.labels, epochLabel],
                    datasets: [{ ...prev.datasets[0], data: [...prev.datasets[0].data, newLoss] }]
                };
            }
            return prev;
        });
      };

      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setCurrentLoss(data.details.loss.toFixed(6));
        updateChart(data.details.loss, data.details.epoch);
      } else if (data.ready || data.state === 'SUCCESS' || data.state === 'FAILURE') {
        const finalResult = data.result || {};
        const finalLoss = finalResult.results?.final_loss ?? (finalResult.results?.loss?.[finalResult.results.loss.length - 1]);
        setCurrentLoss(finalLoss !== undefined ? finalLoss.toFixed(6) : (data.state === 'FAILURE' ? 'Hata!' : 'N/A'));
        
        // Eğer tüm loss geçmişi geldiyse, grafiği onunla doldur
        if (finalResult.results?.loss && Array.isArray(finalResult.results.loss)) {
            const losses = finalResult.results.loss;
            const labels = Array.from({ length: losses.length }, (_, i) => `E${i + 1}`);
            setChartData({ labels: labels, datasets: [{...chartData.datasets[0], data: losses }]});
        }
        if (ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
        }
      }
    };

    ws.current.onerror = () => setStatus({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    ws.current.onclose = () => {
      setStatus(prev => {
        if (prev?.state === 'SUCCESS' || prev?.state === 'FAILURE' || prev?.state === 'ERROR') return prev;
        return { ...prev, state: 'DISCONNECTED', details: { status_text: `Bağlantı kesildi.` } };
      });
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [taskId]);

  let progressPercent = 0;
  if (status?.state === 'SUCCESS') {
    progressPercent = 100;
  } else if (status?.details?.total_epochs) {
    progressPercent = ((status.details.epoch || 0) / status.details.total_epochs) * 100;
  }

  let statusText = 'İlerleme durumu bekleniyor...';
  if (status?.state === 'SUCCESS') statusText = 'Eğitim başarıyla tamamlandı!';
  else if (status?.details?.status_text) statusText = status.details.status_text;
  
  return (
    <div className="live-tracker-pane card">
      <button className="close-button" onClick={onClose}>×</button>
      <div className="tracker-header">
        <h4><span role="img" aria-label="satellite">🛰️</span> Canlı Deney Takibi: {pipelineName} {ticker && `(${ticker})`}</h4>
        <div className="tracker-info">
            <span className="exp-id">ID: {taskId}</span>
            <span className={`status-badge status-${status?.state?.toLowerCase()}`}>{status?.state || 'Bilinmiyor'}</span>
        </div>
      </div>
      
      <div className="tracker-body">
        <div className="tracker-progress">
          <p>{statusText}</p>
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
      {status?.state === 'FAILURE' && <p className="feedback error">{status?.result?.error_message || 'Bilinmeyen bir hata oluştu.'}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = {
  taskId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LiveTrackerPane;