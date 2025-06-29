// dashboard/src/components/LiveTrackerPane.jsx

import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getCssVar } from '../utils/cssUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const initialStatus = { 
  state: 'CONNECTING', 
  details: { status_text: 'Worker\'a bağlanılıyor...' }
};

function LiveTrackerPane({ taskId, onClose }) {
  const [liveData, setLiveData] = useState({ 
    status: initialStatus,
    chart: { labels: [], datasets: [{ data: [] }] }
  });
  
  const chartOptions = useMemo(() => ({
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
  }), []);

  useEffect(() => {
    if (!taskId) return;

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
    
    return () => { if (newSocket.readyState === 1) newSocket.close(1000, "Component unmounting"); };
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
      <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
        <div style={{flex: 1}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <p style={{ margin: 0, color: 'var(--text-color-darker)', fontSize: '0.9em' }}>{status_text || state}</p>
                {epoch && total_epochs && (
                    <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{epoch} / {total_epochs}</span>
                )}
            </div>
            <progress value={progressPercent} max="100" style={{width: '100%', height: '10px'}}></progress>
        </div>
        <div style={{flex: 2, height: '100px', position: 'relative'}}>
          {liveData.chart.labels.length > 0 ? (
            <Line data={liveData.chart} options={chartOptions} />
          ) : (
            <div style={{textAlign: 'center', color: 'var(--text-color-darker)'}}>Kayıp verisi bekleniyor...</div>
          )}
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