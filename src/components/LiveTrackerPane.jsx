import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Chart.js'in tüm bileşenleri otomatik kaydetmesini sağlar
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';

// Anotasyon eklentisini kaydet
Chart.register(annotationPlugin);

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  
  // Ping animasyonu için state
  const [pingAnnotation, setPingAnnotation] = useState(null);
  
  // WebSocket nesnesini saklamak için ref (BİLEŞENİN İÇİNDE)
  const socketRef = useRef(null);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'easeInOutQuad',
    },
    plugins: { 
      legend: { display: false }, 
      tooltip: {
        enabled: true,
        backgroundColor: 'var(--content-bg)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        padding: 10,
        titleFont: { weight: 'bold' },
        bodyFont: { size: 14 },
        displayColors: false,
        callbacks: {
          label: (context) => `Kayıp: ${context.parsed.y.toFixed(6)}`,
        }
      },
      annotation: {
        animations: {
          numbers: {
            properties: ['radius'],
            duration: 1000,
          }
        },
        annotations: {
          ...(pingAnnotation && { ping: pingAnnotation })
        }
      }
    },
    scales: { 
      y: { 
        beginAtZero: false,
        grid: { color: 'var(--border-color)', borderDash: [2, 4] },
        ticks: { maxTicksLimit: 5, font: { size: 10 } },
      }, 
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 10 } },
      } 
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
        pointBackgroundColor: 'var(--primary-color)', pointBorderColor: 'var(--text-inverse)',
        pointHoverBackgroundColor: 'var(--text-inverse)', pointHoverBorderColor: 'var(--primary-color)',
        pointRadius: 3, pointHoverRadius: 6, tension: 0.3, fill: true, borderWidth: 2,
      }]
    });

    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    socketRef.current = socket;
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusData(data);

      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setChartData(prev => {
          const epochLabel = `E${data.details.epoch}`;
          if (prev.labels.includes(epochLabel)) return prev;
          
          const newLabels = [...prev.labels, epochLabel].slice(-30);
          const newLossData = [...prev.datasets[0].data, data.details.loss].slice(-30);
          
          setPingAnnotation({
            type: 'point', xValue: epochLabel, yValue: data.details.loss,
            radius: 15, backgroundColor: 'color-mix(in srgb, var(--primary-color) 25%, transparent)',
            borderColor: 'var(--primary-color)', borderWidth: 2, borderDash: [6, 6]
          });
          setTimeout(() => setPingAnnotation(null), 1000);

          return { ...prev, datasets: [{ ...prev.datasets[0], data: newLossData }], labels: newLabels };
        });
      } else if (data.result?.results?.loss) {
        const finalLossHistory = data.result.results.loss;
        setChartData(prev => {
          const newLabels = Array.from({ length: finalLossHistory.length }, (_, i) => `E${i + 1}`);
          return { ...prev, labels: newLabels, datasets: [{ ...prev.datasets[0], data: finalLossHistory }] };
        });
      }
    };
    
    socket.onerror = () => { setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } }); };
    socket.onclose = () => { setStatusData(prev => (['SUCCESS', 'FAILURE', 'ERROR'].includes(prev.state)) ? prev : { ...prev, state: 'DISCONNECTED' }); };
    
    return () => {
      socket.close(1000, "Component unmounting");
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