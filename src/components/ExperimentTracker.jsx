// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentTracker.jsx ==========
import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

// Chart.js bileşenlerini kaydet
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ExperimentTracker({ taskId }) {
  const [status, setStatus] = useState(null); // Görevin genel durumu (PENDING, PROGRESS, SUCCESS, FAILURE)
  const [chartData, setChartData] = useState({ labels: [], datasets: [] }); // Canlı grafik için veri
  const ws = useRef(null); // WebSocket bağlantısını tutmak için ref

  useEffect(() => {
    if (!taskId) {
      // taskId yoksa hiçbir şey yapma veya hata göster
      setStatus({ state: 'NO_TASK', details: { status_text: 'Takip edilecek görev ID\'si bulunamadı.' } });
      return;
    }

    // Önceki bağlantıyı temizle (varsa)
    if (ws.current) {
      ws.current.close();
    }
    
    // Geçmiş verilerini ve durumu sıfırla
    setHistory([]); // Bu aslında chartData içinde yönetiliyor
    setChartData({ labels: [], datasets: [] });
    setStatus({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });


    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
        console.log(`WebSocket connected for task ${taskId}`);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data from WebSocket:", data);
      setStatus(data); // Genel durumu güncelle
      
      // Eğer durum PROGRESS ise ve kayıp (loss) bilgisi varsa, grafiğe ekle
      if(data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setChartData(prevData => {
          const epoch = data.details.epoch;
          const loss = data.details.loss;

          // Eğer veri gelmişse ve epoch daha önce eklenmemişse ekle
          if (!prevData.labels.includes(`Epoch ${epoch}`)) {
            const newLabels = [...prevData.labels, `Epoch ${epoch}`];
            const newLossData = [...(prevData.datasets[0]?.data || []), loss];
            return {
              labels: newLabels,
              datasets: [{
                label: 'Eğitim Kaybı',
                data: newLossData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
                fill: false
              }]
            };
          }
          return prevData; // Zaten eklenmişse değişiklik yapma
        });
      }
    };
    
    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    };

    ws.current.onclose = () => {
      console.log(`WebSocket disconnected for task ${taskId}`);
    };

    // Bileşen DOM'dan kaldırıldığında WebSocket bağlantısını temizle
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null; // Ref'i temizle
      }
    };
  }, [taskId]); // Sadece taskId değiştiğinde yeniden bağlan

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
          <progress value={progressPercent} max="100"></progress>
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
            animation: false, // Canlı grafiklerde animasyonu kapatmak akıcılığı artırır
            responsive: true, 
            maintainAspectRatio: false, // Container boyutuna uyum sağlar
            scales: {
                y: { beginAtZero: false } // Y ekseni 0'dan başlamasın
            }
          }} />
        </div>
      )}
      {chartData.labels.length === 0 && status?.state === 'PROGRESS' && <p>Grafik verisi bekleniyor (ilk epoch tamamlandığında görünecektir)...</p>}
    </div>
  );
}

export default ExperimentTracker;