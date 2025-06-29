// ========== YENİ DOSYA: dashboard/src/components/ExperimentCard.jsx ==========
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function ExperimentCard({ experiment, onSelect }) {
  const navigate = useNavigate();
  // Kartın kendi internal state'i, WebSocket'ten gelen canlı verilerle güncellenecek
  const [currentStatus, setCurrentStatus] = useState(experiment.status);
  const [currentLoss, setCurrentLoss] = useState(experiment.final_loss);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(experiment.status || "Bilgi bekleniyor...");
  const ws = useRef(null); // WebSocket bağlantısını tutmak için ref

  useEffect(() => {
    // Sadece çalışan veya henüz başlamış deneyler için WebSocket bağlantısı kur
    const isLiveStatus = (status) => status === 'STARTED' || status === 'PROGRESS';
    let cleanupNeeded = false;

    if (isLiveStatus(experiment.status)) { // İlk render'da statüye göre karar ver
      cleanupNeeded = true;
      const wsUrl = `ws://localhost:8000/ws/task_status/${experiment.id}`;
      
      // Önceki bağlantıyı temizle (varsa)
      if (ws.current) { ws.current.close(); }
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`WebSocket connected for card (Task: ${experiment.id})`);
        setStatusText("Bağlantı kuruldu, veri bekleniyor...");
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setCurrentStatus(data.state);
        
        if (data.state === 'PROGRESS') {
          setCurrentLoss(data.details?.loss);
          if (data.details?.total_epochs) {
            setProgress(((data.details.epoch || 0) / data.details.total_epochs) * 100);
          }
          setStatusText(data.details?.status_text || `Epoch ${data.details?.epoch}/${data.details?.total_epochs}`);
        } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
          // Görev tamamlandığında veya başarısız olduğunda son durumu ve sonucu al
          if (data.result?.final_loss !== undefined) {
             setCurrentLoss(data.result.final_loss);
          } else if (data.result?.loss && Array.isArray(data.result.loss)) { // Eğitim geçmişindeki son kayıp
             setCurrentLoss(data.result.loss[data.result.loss.length - 1]);
          }
          
          if (data.state === 'SUCCESS') setProgress(100);
          else setProgress(0); // Başarısız ise ilerleme 0
          setStatusText(data.result?.error_message || data.state); // Hata mesajı varsa onu göster
          
          // Görev bittiğinde WebSocket bağlantısını kapat
          if (ws.current) {
            ws.current.close();
          }
        }
      };

      ws.current.onerror = (error) => {
        console.error(`WebSocket Error for card (Task: ${experiment.id}):`, error);
        setCurrentStatus("ERROR");
        setStatusText("WebSocket bağlantı hatası!");
        if (ws.current) ws.current.close(); // Hata durumunda da kapat
      };

      ws.current.onclose = () => {
        console.log(`WebSocket disconnected for card (Task: ${experiment.id})`);
        setCurrentStatus(prevStatus => {
          // Eğer başarı veya hata ile kapanmadıysa DISCONNECTED yap
          if (prevStatus === 'SUCCESS' || prevStatus === 'FAILURE' || prevStatus === 'ERROR') {
            return prevStatus;
          }
          return 'DISCONNECTED';
        });
        setStatusText(prevStatusText => {
            if (prevStatusText.startsWith("WebSocket")) return prevStatusText;
            return `Bağlantı kesildi. Son durum: ${currentStatus}`;
        });
      };
    } else {
        // Eğer deney başlangıçta tamamlanmış veya başarısız durumdaysa, WebSocket kurmaya gerek yok
        setCurrentStatus(experiment.status);
        setCurrentLoss(experiment.final_loss);
        setProgress(experiment.status === 'SUCCESS' ? 100 : 0);
        setStatusText(experiment.status);
    }

    // Bileşen DOM'dan kaldırıldığında WebSocket bağlantısını temizle
    return () => {
      if (cleanupNeeded && ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [experiment.id, experiment.status, experiment.final_loss]); // Deney verileri değiştiğinde yeniden bağlan

  const handleCardClick = () => {
    navigate(`/experiments/${experiment.id}`); // Doğrudan yönlendir
    if (onSelect) { // onSelect prop'u varsa (eski kullanım için)
      onSelect(experiment.id);
    }
  };

  return (
    <div className="card experiment-card clickable" onClick={handleCardClick}>
      <h3>
        {experiment.pipeline_name || 'Bilinmeyen Pipeline'} 
        {experiment.ticker && <span className="exp-id"> ({experiment.ticker})</span>}
      </h3>
      <p><strong>ID:</strong> <span className="exp-id">{experiment.id}</span></p>
      <p><strong>Durum:</strong> 
        <span className={`status-badge status-${currentStatus?.toLowerCase()}`}>{currentStatus || 'Bilinmiyor'}</span>
      </p>
      
      {(currentStatus === 'STARTED' || currentStatus === 'PROGRESS') && (
        <div className="progress-section">
          <p>{statusText}</p>
          <progress value={progress} max="100"></progress>
          <p>Kayıp: <strong>{currentLoss !== undefined && currentLoss !== null ? currentLoss.toFixed(6) : 'N/A'}</strong></p>
        </div>
      )}
      {(currentStatus === 'SUCCESS' || currentStatus === 'FAILURE' || currentStatus === 'ERROR' || currentStatus === 'DISCONNECTED') && (
        <p>Son Kayıp: <strong>{currentLoss !== undefined && currentLoss !== null ? currentLoss.toFixed(6) : 'N/A'}</strong></p>
      )}
    </div>
  );
}

ExperimentCard.propTypes = {
  experiment: PropTypes.object.isRequired,
  onSelect: PropTypes.func, // Optional callback for parent component
};

export default ExperimentCard;