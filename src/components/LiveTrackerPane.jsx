import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ label: 'Loss', data: [] }] });
  
  // ÖNEMLİ: useRef, StrictMode'un çift render'ından etkilenmez.
  // Bu yüzden WebSocket nesnesini burada tutmak doğrudur.
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
    // Eğer taskId yoksa veya zaten bir bağlantı varsa (StrictMode'un ikinci render'ı gibi), hiçbir şey yapma.
    if (!taskId) {
      return;
    }

    // State'leri sıfırla
    setStatusData({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setChartData({
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [], borderColor: 'var(--primary-color)', 
        backgroundColor: 'color-mix(in srgb, var(--primary-color) 20%, transparent)',
        tension: 0.1, fill: true, pointRadius: 2,
      }]
    });
    
    // Yeni bir WebSocket bağlantısı oluştur
    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    ws.current = socket; // ref'i güncelle

    socket.onmessage = (event) => {
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

    socket.onerror = () => {
        setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    };

    socket.onclose = () => {
        setStatusData(prev => (['SUCCESS', 'FAILURE', 'ERROR'].includes(prev.state)) ? prev : { ...prev, state: 'DISCONNECTED' });
    };

    // --- StrictMode için anahtar temizleme fonksiyonu ---
    return () => {
      // Bu useEffect'in temizleme fonksiyonu, sadece bu useEffect içinde oluşturulan
      // 'socket' nesnesini kapatmalıdır. Bu, StrictMode'un ilk render'dan sonra
      // doğru bağlantıyı kapatmasını ve ikinci render'ın temiz bir başlangıç yapmasını sağlar.
      socket.close();
    };
  }, [taskId]); // useEffect sadece taskId değiştiğinde yeniden çalışır.
  
  // Arayüz render mantığı (değişiklik yok)
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
      {state === 'FAILURE' && result?.error_message && <p className="feedback error" style={{marginTop: '15px'}}>{result.error_message}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = { 
  taskId: PropTypes.string.isRequired, 
  onClose: PropTypes.func.isRequired, 
};

export default LiveTrackerPane;