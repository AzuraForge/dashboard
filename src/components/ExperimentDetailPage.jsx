// ========== YENİ DOSYA: dashboard/src/components/ExperimentDetailPage.jsx ==========
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTaskStatus } from '../services/api'; // API servisinden getTaskStatus'u import ediyoruz
import { Line } from 'react-chartjs-2'; // Grafik için

// Chart.js bileşenlerini kaydet
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


function ExperimentDetailPage() {
  const { experimentId } = useParams(); // URL'den experimentId'yi alıyoruz
  const [experimentData, setExperimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lossChartData, setLossChartData] = useState({ labels: [], datasets: [] });


  useEffect(() => {
    const fetchExperimentDetails = async () => {
      try {
        setLoading(true);
        // API'dan experimentId (ki bu aynı zamanda Celery task ID'si) ile detayları çek
        const response = await getTaskStatus(experimentId);
        setExperimentData(response.data);
        setError(null);

        // Kayıp grafiği için veriyi hazırla
        if (response.data.status === 'SUCCESS' && response.data.result?.loss) {
            const losses = response.data.result.loss;
            const labels = Array.from({ length: losses.length }, (_, i) => `Epoch ${i + 1}`);
            setLossChartData({
                labels: labels,
                datasets: [{
                    label: 'Eğitim Kaybı (Loss)',
                    data: losses,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.1,
                    fill: false
                }]
            });
        }

      } catch (err) {
        setError(`Deney detayları yüklenemedi: ${err.message || 'Bilinmeyen Hata'}. API'nizin çalıştığından emin olun.`);
        console.error("Error fetching experiment details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperimentDetails();
  }, [experimentId]); // experimentId değiştiğinde yeniden veri çek

  if (loading) return <p>Deney detayları yükleniyor...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!experimentData) return <p>Deney bulunamadı.</p>;

  // API'dan gelen 'result' objesi, worker'dan dönen veriyi içerir.
  // Bu veri, 'SUCCESS' durumunda final_report_data'nın 'results' alanına denk gelir.
  // 'config' objesi ise doğrudan celery task'ına gönderilen config'tir.
  const { status, config, result, error: apiError } = experimentData;

  const displayResults = status === 'SUCCESS' ? result : (status === 'FAILURE' ? result : null); // Hata durumunda result error mesajını tutabilir
  const displayError = status === 'FAILURE' ? (apiError || result?.error_message || 'Bilinmeyen Hata') : null;

  return (
    <div className="experiment-detail-page">
      <h2>Deney Detayları: <span className="exp-id">{experimentId}</span></h2>
      <p><strong>Durum:</strong> <span className={`status-badge status-${status?.toLowerCase()}`}>{status || 'Bilinmiyor'}</span></p>
      {displayError && <p className="feedback error">Hata: {displayError}</p>}

      <h3>Konfigürasyon</h3>
      <pre className="code-block">{JSON.stringify(config, null, 2)}</pre>

      {displayResults && status === 'SUCCESS' && (
        <>
          <h3>Sonuçlar</h3>
          <pre className="code-block">{JSON.stringify(displayResults, null, 2)}</pre>

          {lossChartData.labels.length > 0 && (
            <div className="chart-container">
              <h4>Eğitim Kaybı Geçmişi</h4>
              <Line data={lossChartData} options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { y: { beginAtZero: false }}
              }} />
            </div>
          )}
        </>
      )}

      {status === 'FAILURE' && displayResults && displayResults.traceback && (
        <>
          <h3>Detaylı Hata Mesajı</h3>
          <pre className="code-block">{displayResults.traceback}</pre>
        </>
      )}

    </div>
  );
}

export default ExperimentDetailPage;