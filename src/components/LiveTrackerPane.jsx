import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart } from 'chart.js';
import 'chart.js/auto';
import { getCssVar } from '../utils/cssUtils';

// Sabit başlangıç durumları
const initialStatus = { 
  state: 'CONNECTING', 
  details: { status_text: 'Worker\'a bağlanılıyor...' }
};

function LiveTrackerPane({ taskId, onClose }) {
  // Tek bir state objesi
  const [liveData, setLiveData] = useState({ 
    status: initialStatus,
    chart: { labels: [], datasets: [{ data: [] }] } // Başlangıçta boş
  });
  
  const socketRef = useRef(null);
  
  const chartOptions = useMemo(() => {
    return {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 300, easing: 'linear' },
      plugins: { 
        legend: { display: false }, 
        tooltip: {
          enabled: true, backgroundColor: getCssVar('--content-bg'),
          titleColor: getCssVar('--text-color'), bodyColor: getCssVar('--text-color'),
          borderColor: getCssVar('--border-color'), borderWidth: 1, padding: 10,
          displayColors: false,
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => `Kayıp: ${ctx.parsed.y.toFixed(6)}`,
          }
        },
      },
      scales: { 
        y: { 
          grid: { color: getCssVar('--border-color'), borderDash: [2, 4], drawTicks: false },
          ticks: { padding: 10, maxTicksLimit: 5, font: { size: 12 }, color: getCssVar('--text-color-darker') },
        }, 
        x: {
          grid: { display: false },
          ticks: { padding: 10, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 12 }, color: getCssVar('--text-color-darker') },
        } 
      }
    };
  }, []);

  useEffect(() => {
    if (!taskId) return;

    // YENİ: Başlangıç chart state'ini renklerle birlikte burada ayarla
    const initialChartWithColors = {
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [], fill: true,
        borderColor: getCssVar('--primary-color'),
        backgroundColor: `color-mix(in srgb, ${getCssVar('--primary-color')} 20%, transparent)`,
        tension: 0.4, borderWidth: 2,
        pointRadius: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1 ? 6 : 0,
        pointBorderColor: getCssVar('--text-inverse'),
        pointBackgroundColor: getCssVar('--primary-color'),
        pointHoverRadius: 8,
      }]
    };
    
    setLiveData({ status: initialStatus, chart: initialChartWithColors });

    const newSocket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    socketRef.current = newSocket;
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setLiveData(prev => {
        let newChart = prev.chart;
        if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
          const epochLabel = `E${data.details.epoch}`;
          if (!prev.chart.labels.includes(epochLabel)) {
            const newLabels = [...prev.chart.labels, epochLabel].slice(-30);
            const newLossData = [...prev.chart.datasets[0].data, data.details.loss].slice(-30);
            newChart = { ...prev.chart, labels: newLabels, datasets: [{ ...prev.chart.datasets[0], data: newLossData }] };
          }
        } else if (data.result?.results?.loss) {
          const finalLossHistory = data.result.results.loss;
          newChart = {
            ...prev.chart,
            labels: Array.from({ length: finalLossHistory.length }, (_, i) => `E${i + 1}`),
            datasets: [{ ...prev.chart.datasets[0], data: finalLossHistory }]
          };
        }
        return { status: data, chart: newChart };
      });
    };
    
    newSocket.onerror = () => setLiveData(prev => ({ ...prev, status: { state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } }}));
    newSocket.onclose = () => setLiveData(prev => (['SUCCESS', 'FAILURE', 'ERROR'].includes(prev.status.state)) ? prev : { ...prev, status: { ...prev.status, state: 'DISCONNECTED' }});
    
    return () => { newSocket.close(1000, "Component unmounting"); };
  }, [taskId]);
  
  const { state, details, result } = liveData.status;
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
          {liveData.chart.labels.length > 0 && <Line data={liveData.chart} options={chartOptions} />}
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