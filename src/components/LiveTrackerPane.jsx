import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  
  const ws = useRef(null);
  
  const chartOptions = {
    animation: false, responsive: true, maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, 
      tooltip: { enabled: true, backgroundColor: 'var(--content-bg)', borderColor: 'var(--border-color)' } 
    },
    scales: { 
      y: { beginAtZero: false, ticks: { maxTicksLimit: 5 } }, 
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } } 
    }
  };

  useEffect(() => {
    if (!taskId) return;

    setStatusData({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setChartData({
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [], borderColor: 'var(--primary-color)',
        backgroundColor: 'color-mix(in srgb, var(--primary-color) 20%, transparent)',
        tension: 0.1, fill: true, pointRadius: 2,
      }]
    });

    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    ws.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusData(data); // Önce genel durumu güncelle

      // --- ANA DÜZELTME: Veri işleme mantığını tek bir yerde toplama ---
      
      let finalLossHistory = null;

      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        // Canlı veri geliyorsa, grafiği anlık güncelle
        setChartData(prev => {
          const epochLabel = `E${data.details.epoch}`;
          if (prev.labels.includes(epochLabel)) return prev;
          const newLabels = [...prev.labels, epochLabel].slice(-50);
          const newLossData = [...prev.datasets[0].data, data.details.loss].slice(-50);
          return { ...prev, datasets: [{ ...prev.datasets[0], data: newLossData }], labels: newLabels };
        });
      } 
      // GÖREV BİTTİĞİNDE (SUCCESS veya FAILURE)
      else if (data.result && data.result.results && data.result.results.loss) {
        // Eğer görev bittiyse ve sonuçlarda kayıp geçmişi varsa, bu veriyi kullan
        finalLossHistory = data.result.results.loss;
      }

      // Eğer görev bitti ve 'finalLossHistory' verisi bulunduysa, grafiği son haliyle çiz.
      // Bu, çok hızlı biten görevlerin bile grafiğinin çizilmesini garanti eder.
      if (finalLossHistory) {
        setChartData(prev => {
          const newLabels = Array.from({ length: finalLossHistory.length }, (_, i) => `E${i + 1}`);
          return {
            ...prev,
            labels: newLabels,
            datasets: [{ ...prev.datasets[0], data: finalLossHistory }]
          };
        });
      }
    };

    socket.onerror = () => { setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } }); };
    socket.onclose = () => { setStatusData(prev => (['SUCCESS', 'FAILURE', 'ERROR'].includes(prev.state)) ? prev : { ...prev, state: 'DISCONNECTED' }); };

    return () => {
      socket.close();
    };
  }, [taskId]);
  
  const { state, details, result } = statusData;
  const { pipeline_name, data_sourcing } = details?.config || result?.config || {};
  const { total_epochs, epoch, status_text } = details || {};
  const progressPercent = state === 'SUCCESS' ? 100 : (total_epochs ? (epoch / total_epochs) * 100 : 0);
  
  return (
    <div className="live-tracker-pane">
      <button className="close-button" onClick={onClose}>×</button>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
        <h4><span role="img" aria-label="satellite">🛰️</span> Canlı Takip: {pipeline_name || "..."} {data_sourcing?.ticker && `(${data_sourcing.ticker})`}</h4>
        <div><span className="exp-id">ID: {taskId}</span><span className={`status-badge status-${state?.toLowerCase()}`}>{state}</span></div>
      </div>
      <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
        <div style={{flex: 1}}><p>{status_text || state}</p><progress value={progressPercent} max="100" style={{width: '100%'}}></progress></div>
        <div style={{flex: 2, height: '100px'}}>
          {chartData.labels.length > 0 && <Line data={chartData} options={chartOptions} />}
        </div>
      </div>
      {state === 'FAILURE' && result?.error && <p className="feedback error" style={{marginTop: '15px', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto'}}>{result.error}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = { 
  taskId: PropTypes.string.isRequired, 
  onClose: PropTypes.func.isRequired, 
};

export default LiveTrackerPane;