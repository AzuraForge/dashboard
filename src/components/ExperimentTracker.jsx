// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentTracker.jsx ==========
import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ExperimentTracker({ taskId }) {
  const [status, setStatus] = useState(null); 
  const [chartData, setChartData] = useState({ labels: [], datasets: [] }); 
  const ws = useRef(null); 

  useEffect(() => {
    if (!taskId) {
      setStatus({ state: 'NO_TASK', details: { status_text: 'Takip edilecek görev ID\'si bulunamadı.' } });
      return;
    }

    if (ws.current) { ws.current.close(); }
    
    // Geçmiş verilerini ve durumu sıfırla
    setChartData({ labels: [], datasets: [{ 
        label: 'Eğitim Kaybı', data: [], 
        borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1, fill: false
    }]});
    setStatus({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });

    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => { console.log(`WebSocket connected for task ${taskId}`); };
    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    };
    ws.current.onclose = () => { console.log(`WebSocket disconnected for task ${taskId}`); };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data from WebSocket:", data);
      setStatus(data);
      
      if(data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setChartData(prevData => {
          const epoch = data.details.epoch;
          const loss = data.details.loss;

          if (!prevData.labels.includes(`Epoch ${epoch}`)) {
            return {
              labels: [...prevData.labels, `Epoch ${epoch}`],
              datasets: [{
                ...prevData.datasets[0], // Mevcut dataset özelliklerini koru
                data: [...prevData.datasets[0].data, loss]
              }]
            };
          }
          return prevData;
        });
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [taskId]); 

  const progressPercent = status?.details?.total_epochs 
    ? (status.details.epoch / status.details.total_epochs) * 100
    : 0;

  return (
    <div className="tracker-container">
      <h3>Canlı Deney Takibi</h3>
      <p><strong>Görev ID:</strong> <span className="exp-id">{taskId}</span></p>
      <p><strong>Durum:</strong> <span className={`status-badge status-${status?.state?.toLowerCase()}`}>{status?.state || 'Bilinmiyor'}</span></p>
      
      {status?.state === 'PROGRESS' && (
        <div className="progress-section">
          <p>{status.details.status_text}</p>
          <progress value={progressPercent} max="100" style={{width: '100%', height: '25px'}}></progress>
          <p>Mevcut Kayıp (Loss): <strong>{status.details.loss?.toFixed(6) || 'N/A'}</strong></p>
        </div>
      )}

      {status?.state === 'SUCCESS' && <p className="feedback success">Eğitim başarıyla tamamlandı!</p>}
      {status?.state === 'FAILURE' && <p className="feedback error">Eğitimde bir hata oluştu!</p>}
      {status?.state === 'ERROR' && <p className="feedback error">{status.details.status_text}</p>}
      
      {chartData.labels.length > 0 && (
        <div className="chart-container">
          <h4>Canlı Kayıp Grafiği</h4>
          <Line data={chartData} options={{ 
            animation: false, 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { y: { beginAtZero: false }}
          }} />
        </div>
      )}
      {chartData.labels.length === 0 && status?.state === 'PROGRESS' && <p>Grafik verisi bekleniyor (ilk epoch tamamlandığında görünecektir)...</p>}
    </div>
  );
}

export default ExperimentTracker;