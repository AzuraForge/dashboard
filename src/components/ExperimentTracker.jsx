// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentTracker.jsx (URL'den taskId Okuma ve Başlık) ==========
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ExperimentTracker() { 
  const { taskId } = useParams(); // URL'den taskId'yi al
  const [status, setStatus] = useState(null); 
  const [chartData, setChartData] = useState({ 
    labels: [], 
    datasets: [{ 
      label: 'Eğitim Kaybı', data: [], 
      borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1, fill: false
    }] 
  }); 
  const ws = useRef(null); 
  const [currentLoss, setCurrentLoss] = useState('N/A'); // Canlı kayıp için state

  useEffect(() => {
    if (!taskId) {
      setStatus({ state: 'NO_TASK', details: { status_text: 'Takip edilecek görev ID\'si bulunamadı.' } });
      return;
    }

    // Önceki bağlantıyı temizle (varsa)
    if (ws.current) { ws.current.close(); }
    
    // Geçmiş verilerini ve durumu sıfırla
    setChartData({ labels: [], datasets: [{ 
        label: 'Eğitim Kaybı', data: [], 
        borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1, fill: false
    }]});
    setStatus({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    setCurrentLoss('N/A');


    const wsUrl = `ws://localhost:8000/ws/task_status/${taskId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
        console.log(`WebSocket connected for task ${taskId}`);
        setStatus({ state: 'CONNECTED', details: { status_text: 'Bağlantı kuruldu, veri bekleniyor...' } });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data from WebSocket:", data);
      setStatus(data); // Genel durumu güncelle
      
      if(data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setCurrentLoss(data.details.loss.toFixed(6)); // Canlı kayıp
        setChartData(prevData => {
          const epoch = data.details.epoch;
          const loss = data.details.loss;

          // Eğer veri gelmişse ve epoch daha önce eklenmemişse ekle
          if (!prevData.labels.includes(`Epoch ${epoch}`)) {
            return {
              labels: [...prevData.labels, `Epoch ${epoch}`],
              datasets: [{
                ...prevData.datasets[0], 
                data: [...prevData.datasets[0].data, loss]
              }]
            };
          }
          return prevData;
        });
      } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
        // Görev tamamlandığında veya başarısız olduğunda son durumu ve sonucu al
        const finalLoss = data.result?.final_loss || (data.result?.loss && Array.isArray(data.result.loss) ? data.result.loss[data.result.loss.length - 1] : undefined);
        if (finalLoss !== undefined) {
          setCurrentLoss(finalLoss.toFixed(6));
        } else if (data.state === 'FAILURE' && data.result?.error_message) {
            setCurrentLoss('Hata!');
        } else {
            setCurrentLoss('N/A');
        }

        // Eğer başarılı olduysa ve tam loss history varsa grafiği onunla güncelle
        if (data.state === 'SUCCESS' && data.result?.loss && Array.isArray(data.result.loss)) {
            const losses = data.result.loss;
            const labels = Array.from({ length: losses.length }, (_, i) => `Epoch ${i + 1}`);
            setChartData({
                labels: labels,
                datasets: [{
                    label: 'Eğitim Kaybı',
                    data: losses,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.1,
                    fill: false
                }]
            });
        }
      }
    };
    
    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası veya sunucuya erişilemiyor!' } });
      setCurrentLoss('Hata!');
    };

    ws.current.onclose = () => {
      console.log(`WebSocket disconnected for task ${taskId}`);
      setStatus(prevStatus => {
        if (prevStatus?.state === 'SUCCESS' || prevStatus?.state === 'FAILURE' || prevStatus?.state === 'ERROR') {
          return prevStatus;
        }
        return { 
          ...prevStatus, 
          state: 'DISCONNECTED',
          details: { status_text: `Bağlantı kesildi. Son durum: ${prevStatus?.state}` }
        };
      });
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [taskId]); // taskId değiştiğinde yeniden bağlan

  const progressPercent = status?.details?.total_epochs 
    ? ((status.details.epoch || 0) / status.details.total_epochs) * 100
    : 0;

  return (
    <div className="tracker-container card"> {/* Card stilini uyguladık */}
      <div className="page-header">
        <h1><span role="img" aria-label="satellite">🛰️</span> Canlı Deney Takibi</h1>
        <p>Seçilen deneyin gerçek zamanlı ilerlemesini ve metriklerini izleyin.</p>
      </div>

      <h3>Görev Bilgileri</h3>
      <p><strong>Görev ID:</strong> <span className="exp-id">{taskId}</span></p>
      <p><strong>Durum:</strong> <span className={`status-badge status-${status?.state?.toLowerCase()}`}>{status?.state || 'Bilinmiyor'}</span></p>
      
      {(status?.state === 'STARTED' || status?.state === 'PROGRESS' || status?.state === 'CONNECTED') && (
        <div className="progress-section">
          <p>{status.details?.status_text || 'İlerleme bilgisi bekleniyor...'}</p>
          <progress value={progressPercent} max="100"></progress>
          <p>Mevcut Kayıp (Loss): <strong>{currentLoss}</strong></p>
        </div>
      )}

      {status?.state === 'SUCCESS' && <p className="feedback success">Eğitim başarıyla tamamlandı! Final Kayıp: {currentLoss}</p>}
      {status?.state === 'FAILURE' && <p className="feedback error">Eğitimde bir hata oluştu! Detaylar için aşağıdaki bölüme bakın veya deney detay sayfasına gidin.</p>}
      {status?.state === 'ERROR' && <p className="feedback error">{status.details.status_text}</p>}
      {status?.state === 'NO_TASK' && <p className="feedback info">{status.details.status_text}</p>}
      {status?.state === 'DISCONNECTED' && <p className="feedback info">Canlı takip bağlantısı kesildi. Görev tamamlanmış veya bir hata oluşmuş olabilir. Deney listesinden kontrol edin. Son Kayıp: {currentLoss}</p>}

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
      {chartData.labels.length === 0 && (status?.state === 'PROGRESS' || status?.state === 'CONNECTING' || status?.state === 'CONNECTED' || status?.state === 'STARTED') && <p className="feedback info">Grafik verisi bekleniyor (ilk epoch tamamlandığında veya sonuç raporu hazırlandığında görünecektir)...</p>}
      
      {/* Hata durumunda detaylar */}
      {status?.state === 'FAILURE' && status.details?.traceback && (
        <>
          <h3>Detaylı Hata Mesajı</h3>
          <pre className="code-block">{status.details.traceback}</pre>
        </>
      )}
    </div>
  );
}

export default ExperimentTracker;