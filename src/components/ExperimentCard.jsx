// ========== YENİ DOSYA: dashboard/src/components/ExperimentCard.jsx ==========
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2'; // Grafik bileşeni

// Chart.js bileşenlerini kaydet
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ExperimentCard({ experiment, onSelect }) {
  const navigate = useNavigate();
  // Kartın kendi internal state'i, WebSocket'ten gelen canlı verilerle güncellenecek
  const [currentStatus, setCurrentStatus] = useState(experiment.status);
  const [currentLoss, setCurrentLoss] = useState(experiment.final_loss);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(experiment.status || "Bilgi bekleniyor...");
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const ws = useRef(null); // WebSocket bağlantısını tutmak için ref

  useEffect(() => {
    // Sadece çalışan veya henüz başlamış deneyler için WebSocket bağlantısı kur
    const isLiveStatus = (status) => status === 'STARTED' || status === 'PROGRESS';
    let cleanupNeeded = false;

    // İlk yüklemede ve experiment.id değiştiğinde sıfırlama yap
    setCurrentStatus(experiment.status);
    setCurrentLoss(experiment.final_loss);
    setProgress(experiment.status === 'SUCCESS' ? 100 : 0);
    setStatusText(experiment.status || "Bilgi bekleniyor...");
    setChartData({ // Grafiği sıfırla
        labels: [], 
        datasets: [{ 
            label: 'Eğitim Kaybı', 
            data: [], 
            borderColor: 'rgb(75, 192, 192)', 
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1, 
            fill: false 
        }] 
    });


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
          
          setChartData(prevData => {
            const epoch = data.details.epoch;
            const loss = data.details.loss;

            if (loss !== undefined && epoch !== undefined) {
                // Sadece yeni bir epoch kaydı geldiyse ekle
                if (!prevData.labels.includes(`Epoch ${epoch}`)) {
                    return {
                        labels: [...prevData.labels, `Epoch ${epoch}`],
                        datasets: [{
                            ...prevData.datasets[0], 
                            data: [...(prevData.datasets[0]?.data || []), loss]
                        }]
                    };
                }
            }
            return prevData;
        });

        } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
          // Görev bittiğinde (SUCCESS, FAILURE vb.) son durumu ve sonucu al
          if (data.result?.final_loss !== undefined) {
             setCurrentLoss(data.result.final_loss);
          } else if (data.result?.loss && Array.isArray(data.result.loss)) { // Eğitim geçmişindeki son kayıp
             setCurrentLoss(data.result.loss[data.result.loss.length - 1]);
             setChartData(prevData => { // Tüm geçmişi grafik için yükle
                const losses = data.result.loss;
                const labels = Array.from({ length: losses.length }, (_, i) => `Epoch ${i + 1}`);
                return {
                    labels: labels,
                    datasets: [{
                        ...prevData.datasets[0], 
                        data: losses
                    }]
                };
             });
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
        // Ve tamamlannış veriyi yükle
        setCurrentStatus(experiment.status);
        setCurrentLoss(experiment.final_loss);
        setProgress(experiment.status === 'SUCCESS' ? 100 : 0);
        setStatusText(experiment.status);
        if (experiment.results?.loss && Array.isArray(experiment.results.loss)) {
            const losses = experiment.results.loss;
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

    // Bileşen DOM'dan kaldırıldığında WebSocket bağlantısını temizle
    return () => {
      if (cleanupNeeded && ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [experiment.id, experiment.status, experiment.final_loss, experiment.results]); // Deney verileri değiştiğinde yeniden bağlan

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
      
      {(currentStatus === 'STARTED' || currentStatus === 'PROGRESS' || currentStatus === 'CONNECTED') && (
        <div className="progress-section">
          <p>{statusText}</p>
          <progress value={progress} max="100"></progress>
          <p>Mevcut Kayıp: <strong>{currentLoss !== undefined && currentLoss !== null ? currentLoss.toFixed(6) : 'N/A'}</strong></p>
        </div>
      )}
      {(currentStatus === 'SUCCESS' || currentStatus === 'FAILURE' || currentStatus === 'ERROR' || currentStatus === 'DISCONNECTED') && (
        <p>Son Kayıp: <strong>{currentLoss !== undefined && currentLoss !== null ? currentLoss.toFixed(6) : 'N/A'}</strong></p>
      )}

      {/* Mini Grafik */}
      {chartData.labels.length > 0 && (
          <div className="mini-chart-container" style={{ height: '150px', width: '100%', marginTop: '15px' }}>
              <Line data={chartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, title: { display: false }, tooltip: { enabled: false } },
                  scales: {
                      x: { display: false },
                      y: { display: false, beginAtZero: false }
                  },
                  animation: false, // Canlı grafik için animasyonu kapat
                  elements: { point: { radius: 0 } } // Noktaları gizle
              }} />
          </div>
      )}
    </div>
  );
}

ExperimentCard.propTypes = {
  experiment: PropTypes.object.isRequired,
  onSelect: PropTypes.func, // Optional callback for parent component
};

export default ExperimentCard;