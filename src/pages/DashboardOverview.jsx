// ========== YENİ DOSYA: dashboard/src/pages/DashboardOverview.jsx ==========
import { useState, useEffect } from 'react';
import { fetchExperiments } from '../services/api';
import ExperimentCard from '../components/ExperimentCard';
import ExperimentsList from '../components/ExperimentsList'; // Tamamlanan/başarısız deneyler için
import PropTypes from 'prop-types'; // PropTypes import edildi

function DashboardOverview({ onExperimentSelect, onNewExperimentClick }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getExperiments = async () => {
      try {
        const response = await fetchExperiments();
        // API'den gelen veriye göre sıralama: Önce çalışanlar, sonra en yeni tamamlananlar
        const sortedExperiments = response.data.sort((a, b) => {
          const statusOrder = { 'STARTED': 1, 'PROGRESS': 2, 'FAILURE': 3, 'SUCCESS': 4, 'UNKNOWN': 5 };
          const aStatus = statusOrder[a.status] || 5;
          const bStatus = statusOrder[b.status] || 5;

          if (aStatus !== bStatus) {
            return aStatus - bStatus; // Duruma göre sırala (STARTED en üstte)
          }

          // Aynı durumdaki deneyleri en yeni bitiş tarihine göre sırala (varsa)
          const aDate = a.completed_at ? new Date(a.completed_at) : new Date(0);
          const bDate = b.completed_at ? new Date(b.completed_at) : new Date(0);
          return bDate.getTime() - aDate.getTime(); // En yeni tamamlanan üstte
        });

        setExperiments(sortedExperiments);
        setError(null);
      } catch (err) {
        setError('API sunucusuna bağlanılamadı veya veri çekilemedi. Servislerin çalıştığından emin olun.');
        console.error("Error fetching experiments for overview:", err);
      } finally {
        setLoading(false);
      }
    };
    
    getExperiments();
    const intervalId = setInterval(getExperiments, 5000); // Deneyleri düzenli olarak yenile
    
    return () => clearInterval(intervalId); // Bileşen kaldırıldığında interval'i temizle
  }, []);

  const runningExperiments = experiments.filter(exp => 
    exp.status === 'STARTED' || exp.status === 'PROGRESS'
  );
  const completedOrFailedExperiments = experiments.filter(exp => 
    exp.status === 'SUCCESS' || exp.status === 'FAILURE'
  );

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <h1><span role="img" aria-label="dashboard">📊</span> Genel Bakış</h1>
        <p>Tüm deneylerinizin durumunu ve son gelişmelerini takip edin.</p>
      </div>

      {loading && <p className="feedback info">Veriler yükleniyor...</p>}
      {error && <p className="feedback error">{error}</p>}

      {!loading && !error && (
        <>
          <h2 className="section-title">Çalışan Deneyler ({runningExperiments.length})</h2>
          {runningExperiments.length === 0 ? (
            <p className="feedback info">Şu anda çalışan bir deney bulunmamaktadır. <button onClick={onNewExperimentClick} className="button-link">Yeni bir deney başlatmak</button> ister misiniz?</p>
          ) : (
            <div className="running-experiments-grid">
              {runningExperiments.map(exp => (
                <ExperimentCard key={exp.id} experiment={exp} onSelect={onExperimentSelect} />
              ))}
            </div>
          )}

          <h2 className="section-title">Son Tamamlanan/Başarısız Olan Deneyler ({completedOrFailedExperiments.length})</h2>
          {completedOrFailedExperiments.length === 0 ? (
            <p className="feedback info">Henüz tamamlanan veya başarısız olan bir deney bulunmamaktadır.</p>
          ) : (
            <ExperimentsList experiments={completedOrFailedExperiments} onExperimentSelect={onExperimentSelect} />
          )}
        </>
      )}
    </div>
  );
}

// PropTypes ekleyelim
DashboardOverview.propTypes = {
  onExperimentSelect: PropTypes.func.isRequired,
  onNewExperimentClick: PropTypes.func.isRequired,
};

export default DashboardOverview;