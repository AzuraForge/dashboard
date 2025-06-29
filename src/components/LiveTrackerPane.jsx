import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';

// Bu bileşen için bir kerelik, boş bir başlangıç durumu.
const initialChartData = {
  labels: [],
  datasets: [{
    label: 'Eğitim Kaybı', data: [], borderColor: 'var(--primary-color)',
    backgroundColor: 'color-mix(in srgb, var(--primary-color) 20%, transparent)',
    tension: 0.1, fill: true, pointRadius: 2,
  }]
};

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState(initialChartData);
  
  // WebSocket nesnesini saklamak için ref. StrictMode'un çift render'ından etkilenmez.
  const socketRef = useRef(null);
  
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
    // taskId yoksa hiçbir şey yapma.
    if (!taskId) return;

    // Her yeni taskId için state'leri sıfırla.
    setStatusData({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setChartData(initialChartData);

    // --- YENİ ve SAĞLAM BAĞLANTI MANTIĞI ---
    
    // Eğer zaten bir bağlantı varsa (StrictMode'un önceki render'ından kalma olabilir), önce onu kapat.
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Yeni WebSocket nesnesini oluştur ve ref'e ata.
    const newSocket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    socketRef.current = newSocket;

    newSocket.onopen = () => {
      // Sadece 'CONNECTING' durumundaysa 'CONNECTED'a geçir.
      // Bu, hızlı gelen mesajların state'i ezmesini önler.
      setStatusData(prev => prev.state === 'CONNECTING' ? { ...prev, state: 'CONNECTED', details: { status_text: 'Veri bekleniyor...' } } : prev);
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusData(data); // Gelen veri ile state'i tamamen güncelle

      let finalLossHistory = null;

      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setChartData(prev => {
          const epochLabel = `E${data.details.epoch}`;
          if (prev.labels.includes(epochLabel)) return prev;
          const newLabels = [...prev.labels, epochLabel].slice(-50);
          const newLossData = [...prev.datasets[0].data, data.details.loss].slice(-50);
          return { ...prev, datasets: [{ ...prev.datasets[0], data: newLossData }], labels: newLabels };
        });
      } else if (data.result?.results?.loss) {
        finalLossHistory = data.result.results.loss;
      }

      if (finalLossHistory) {
        setChartData(prev => {
          const newLabels = Array.from({ length: finalLossHistory.length }, (_, i) => `E${i + 1}`);
          return { ...prev, labels: newLabels, datasets: [{ ...prev.datasets[0], data: finalLossHistory }] };
        });
      }
    };

    newSocket.onerror = () => {
      setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    };

    // Temizleme fonksiyonu
    return () => {
      // Bileşen unmount olduğunda (veya StrictMode temizliğinde),
      // o anki render döngüsünde oluşturulan 'newSocket' nesnesini kapat.
      // Bu, her zaman doğru referansı kapatmayı garanti eder.
      newSocket.close(1000, "Component unmounting");
    };
  }, [taskId]); // Bu useEffect SADECE taskId değiştiğinde çalışır.
  
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