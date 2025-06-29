import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ label: 'Loss', data: [] }] });
  const ws = useRef(null);

  const chartOptions = {
    animation: false, responsive: true, maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, 
      tooltip: { enabled: true, backgroundColor: 'var(--content-bg)', borderColor: 'var(--border-color)', } 
    },
    scales: { 
      y: { beginAtZero: false, ticks: { maxTicksLimit: 5 }, }, 
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }, } 
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
    
    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusData(data);
      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setChartData(prev => {
          const epochLabel = `E${data.details.epoch}`;
          if (prev.labels.includes(epochLabel)) return prev;
          const newLabels = [...prev.labels, epochLabel].slice(-50);
          const newData = [...prev.datasets[0].data, data.details.loss].slice(-50);
          return { labels: newLabels, datasets: [{ ...prev.datasets[0], data: newData }] };
        });
      }
    };
    ws.current.onerror = () => setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    ws.current.onclose = () => setStatusData(prev => (prev.state === 'SUCCESS' || prev.state === 'FAILURE') ? prev : { ...prev, state: 'DISCONNECTED' });
    return () => { if (ws.current) ws.current.close(); };
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
        <div style={{flex: 2, height: '100px'}}>{chartData.labels.length > 0 && <Line data={chartData} options={chartOptions} />}</div>
      </div>
    </div>
  );
}
LiveTrackerPane.propTypes = { taskId: PropTypes.string.isRequired, onClose: PropTypes.func.isRequired, };
export default LiveTrackerPane;