// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentDetailPage.jsx ==========
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTaskStatus } from '../services/api';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


function ExperimentDetailPage() {
  const { experimentId } = useParams();
  const [experimentData, setExperimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lossChartData, setLossChartData] = useState({ labels: [], datasets: [] });


  useEffect(() => {
    const fetchExperimentDetails = async () => {
      try {
        setLoading(true);
        const response = await getTaskStatus(experimentId);
        setExperimentData(response.data);
        setError(null);

        // Kayıp grafiği için veriyi hazırla
        // Eğer task_status'tan döndüyse data.result.loss'ta,
        // Eğer list_experiments'tan çekildiyse data.results.loss'ta olabilir.
        const losses = response.data.results?.loss || (response.data.result?.loss && Array.isArray(response.data.result.loss) ? response.data.result.loss : []);
        
        if (losses.length > 0) {
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
        } else {
            setLossChartData({ labels: [], datasets: [] }); // Veri yoksa grafiği sıfırla
        }

      } catch (err) {
        setError(`Deney detayları yüklenemedi: ${err.message || 'Bilinmeyen Hata'}. API'nizin çalıştığından emin olun.`);
        console.error("Error fetching experiment details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperimentDetails();
  }, [experimentId]);

  if (loading) return <p className="feedback info">Deney detayları yükleniyor...</p>;
  if (error) return <p className="feedback error">{error}</p>;
  if (!experimentData) return <p className="feedback info">Deney bulunamadı veya henüz tamamlanmadı.</p>;

  const { status, config, result, user_friendly_error, error: apiErrorFromReport } = experimentData; // user_friendly_error ve apiErrorFromReport eklendi

  // API'dan gelen 'error' alanı, worker'ın results.json'a yazdığı hata mesajı olabilir.
  // user_friendly_error ise bizim API'da oluşturduğumuz özet mesaj.
  const displayError = user_friendly_error || apiErrorFromReport || (status === 'FAILURE' ? (result?.error_message || 'Bilinmeyen Hata') : null);
  const displayTraceback = status === 'FAILURE' ? (result?.traceback || apiErrorFromReport) : null; // Hata izlemesi ya Celery sonucundan ya da rapor dosyasından

  return (
    <div className="experiment-detail-page card">
      <div className="page-header">
        <h1><span role="img" aria-label="magnifying glass">🔍</span> Deney Detayları</h1>
        <p>Seçilen deneyin tüm detaylarını, konfigürasyonunu ve sonuçlarını inceleyin.</p>
      </div>

      <h3>Genel Bilgiler</h3>
      <p><strong>Deney ID:</strong> <span className="exp-id">{experimentId}</span></p>
      <p><strong>Durum:</strong> <span className={`status-badge status-${status?.toLowerCase()}`}>{status || 'Bilinmiyor'}</span></p>
      <p><strong>Pipeline Adı:</strong> {config?.pipeline_name || 'N/A'}</p>
      <p><strong>Sembol:</strong> {config?.data_sourcing?.ticker || 'N/A'}</p>
      <p><strong>Başlangıç Zamanı:</strong> {config?.start_time ? new Date(config.start_time).toLocaleString() : 'N/A'}</p>
      <p><strong>Bitiş Zamanı:</strong> {experimentData.completed_at ? new Date(experimentData.completed_at).toLocaleString() : 'N/A'}</p>
      

      {displayError && <p className="feedback error">Deney Hatası: {displayError}</p>}

      <h3>Konfigürasyon</h3>
      <pre className="code-block">{JSON.stringify(config, null, 2)}</pre>

      {status === 'SUCCESS' && (
        <>
          <h3>Sonuçlar</h3>
          <pre className="code-block">{JSON.stringify(result, null, 2)}</pre>

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

      {displayTraceback && (
        <>
          <h3>Detaylı Hata İzleme (Traceback)</h3>
          <pre className="code-block">{displayTraceback}</pre>
        </>
      )}

    </div>
  );
}

ExperimentDetailPage.propTypes = {
  // experimentId URL parametresinden geldiği için burada propType tanımlamıyoruz
};

export default ExperimentDetailPage;