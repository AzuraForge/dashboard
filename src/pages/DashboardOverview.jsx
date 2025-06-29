import { useState, useEffect, useMemo } from 'react';
import { fetchExperiments } from '../services/api';
import ExperimentCard from '../components/ExperimentCard';
import ExperimentsList from '../components/ExperimentsList';
import PropTypes from 'prop-types';

function DashboardOverview({ onExperimentSelect, onNewExperimentClick }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const allStatuses = useMemo(() => {
    const statuses = new Set(experiments.map(exp => exp.status));
    return ['ALL', ...Array.from(statuses).sort()];
  }, [experiments]);


  useEffect(() => {
    const getExperiments = async () => {
      try {
        const response = await fetchExperiments();
        // API'den gelen veriye göre sıralama: Önce çalışanlar, sonra en yeni tamamlananlar
        const sortedExperiments = response.data.sort((a, b) => {
          const statusOrder = { 'STARTED': 1, 'PROGRESS': 2, 'UNKNOWN': 3, 'DISCONNECTED': 4, 'FAILURE': 5, 'ERROR': 6, 'SUCCESS': 7 };
          const aStatus = statusOrder[a.status] || 99; 
          const bStatus = statusOrder[b.status] || 99;

          if (aStatus !== bStatus) {
            return aStatus - bStatus; 
          }

          const aDate = a.completed_at ? new Date(a.completed_at) : (a.started_at ? new Date(a.started_at) : new Date(0));
          const bDate = b.completed_at ? new Date(b.completed_at) : (b.started_at ? new Date(b.started_at) : new Date(0));
          return bDate.getTime() - aDate.getTime(); 
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
    const intervalId = setInterval(getExperiments, 5000); 
    
    return () => clearInterval(intervalId);
  }, []);

  // Filtrelenmiş deneyleri hesapla
  const filteredExperiments = useMemo(() => {
    let filtered = experiments;

    // Durum filtresi
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(exp => exp.status === filterStatus);
    }

    // Arama terimi filtresi
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.id.toLowerCase().includes(lowerCaseSearchTerm) ||
        (exp.pipeline_name && exp.pipeline_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (exp.ticker && exp.ticker.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (exp.config?.pipeline_name && exp.config.pipeline_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (exp.config?.data_sourcing?.ticker && exp.config.data_sourcing.ticker.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    return filtered;
  }, [experiments, filterStatus, searchTerm]);


  const runningExperiments = filteredExperiments.filter(exp => 
    exp.status === 'STARTED' || exp.status === 'PROGRESS'
  );
  const completedOrFailedExperiments = filteredExperiments.filter(exp => 
    !runningExperiments.some(runningExp => runningExp.id === exp.id)
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
          <div className="card" style={{ marginBottom: '25px', padding: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Deneyleri Filtrele</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 250px', minWidth: '200px', marginBottom: 0 }}>
                <label htmlFor="search-term">Arama:</label>
                <input 
                  type="text" 
                  id="search-term" 
                  placeholder="Deney ID, Pipeline, Sembol ara..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{width: 'calc(100% - 24px)'}}
                />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', minWidth: '150px', marginBottom: 0 }}>
                <label htmlFor="filter-status">Durum:</label>
                <select 
                  id="filter-status" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1em', boxSizing: 'border-box'}}
                >
                  {allStatuses.map(status => (
                    <option key={status} value={status}>{status === 'ALL' ? 'Tümü' : status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <h2 className="section-title">
            <span role="img" aria-label="running">⚡</span>
            Çalışan Deneyler ({runningExperiments.length})
          </h2>
          {runningExperiments.length === 0 ? (
            <p className="feedback info">Şu anda çalışan bir deney bulunmamaktadır. <button onClick={onNewExperimentClick} className="button-link">Yeni bir deney başlatmak</button> ister misiniz?</p>
          ) : (
            <div className="running-experiments-grid">
              {runningExperiments.map(exp => (
                <ExperimentCard key={exp.id} experiment={exp} onSelect={onExperimentSelect} />
              ))}
            </div>
          )}

          <h2 className="section-title">
            <span role="img" aria-label="history">🗂️</span>
            Deney Geçmişi ({completedOrFailedExperiments.length})
          </h2>
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

DashboardOverview.propTypes = {
  onExperimentSelect: PropTypes.func.isRequired,
  onNewExperimentClick: PropTypes.func.isRequired,
};

export default DashboardOverview;