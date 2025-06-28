// ========== YENİ DOSYA: dashboard/src/components/ExperimentTracker.jsx ==========
import { useState, useEffect, useRef } from 'react';

function ExperimentTracker({ taskId }) {
  const [status, setStatus] = useState({ state: 'PENDING', details: { status_text: 'Bağlanılıyor...' } });
  const [history, setHistory] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    if (!taskId) return;

    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onclose = () => console.log("WebSocket disconnected");
    ws.current.onerror = (error) => console.error("WebSocket Error:", error);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);
      
      // Gelen veri 'PROGRESS' durumundaysa ve 'loss' içeriyorsa, geçmişe ekle
      if(data.state === 'PROGRESS' && data.details?.loss) {
        setHistory(prevHistory => [...prevHistory, data.details]);
      }
    };

    // Bileşen kaldırıldığında WebSocket'i kapat
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [taskId]);

  const progressPercent = status.details?.total_epochs 
    ? (status.details.epoch / status.details.total_epochs) * 100
    : 0;

  return (
    <div className="tracker-container">
      <h3>Canlı Deney Takibi</h3>
      <p><strong>Görev ID:</strong> {taskId}</p>
      <p><strong>Durum:</strong> <span className={`status-badge status-${status.state?.toLowerCase()}`}>{status.state}</span></p>
      
      {status.state === 'PROGRESS' && (
        <div>
          <p>{status.details.status_text}</p>
          <progress value={progressPercent} max="100"></progress>
          <p>Mevcut Kayıp (Loss): {status.details.loss?.toFixed(6)}</p>
        </div>
      )}

      {status.state === 'SUCCESS' && <p className="feedback success">Eğitim başarıyla tamamlandı!</p>}
      {status.state === 'FAILURE' && <p className="feedback error">Eğitimde hata oluştu!</p>}
      
      {/* İleride buraya canlı bir grafik de ekleyebiliriz */}
    </div>
  );
}

export default ExperimentTracker;