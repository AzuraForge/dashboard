// ========== YENİ DOSYA: dashboard/src/components/ExperimentTracker.jsx ==========
import { useState, useEffect, useRef } from 'react';

function ExperimentTracker({ taskId }) {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]); // Canlı grafik için veri
  const ws = useRef(null);

  useEffect(() => {
    if (!taskId) return;

    // Önceki bağlantıyı temizle (varsa)
    if (ws.current) {
      ws.current.close();
    }
    
    // Geçmişi sıfırla
    setHistory([]);
    setStatus({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });


    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
        console.log(`WebSocket connected for task ${taskId}`);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data from WebSocket:", data);
      setStatus(data);
      
      if(data.state === 'PROGRESS' && data.details?.loss) {
        setHistory(prevHistory => [...prevHistory, data.details]);
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
      }
    };
  }, [taskId]); // Sadece taskId değiştiğinde yeniden bağlan

  if (!status) {
    return <p>Deney takip bilgileri bekleniyor...</p>;
  }

  const progressPercent = status.details?.total_epochs 
    ? (status.details.epoch / status.details.total_epochs) * 100
    : 0;

  return (
    <div className="tracker-container">
      <h3>Canlı Deney Takibi</h3>
      <p><strong>Görev ID:</strong> <span className="exp-id">{taskId}</span></p>
      <p><strong>Durum:</strong> <span className={`status-badge status-${status.state?.toLowerCase()}`}>{status.state}</span></p>
      
      {status.state === 'PROGRESS' && (
        <div className="progress-section">
          <p>{status.details.status_text}</p>
          <progress value={progressPercent} max="100" style={{width: '100%', height: '25px'}}></progress>
          <p>Mevcut Kayıp (Loss): <strong>{status.details.loss?.toFixed(6)}</strong></p>
        </div>
      )}

      {status.state === 'SUCCESS' && <p className="feedback success">Eğitim başarıyla tamamlandı!</p>}
      {status.state === 'FAILURE' && <p className="feedback error">Eğitimde bir hata oluştu!</p>}
      
      {/* İleride buraya canlı bir grafik de eklenecek. Şimdilik bu kadar yeterli. */}
    </div>
  );
}

export default ExperimentTracker;