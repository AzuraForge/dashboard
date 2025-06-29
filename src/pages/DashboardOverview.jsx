import { useState, useEffect, useMemo } from 'react';
import { fetchExperiments } from '../services/api';
import ExperimentCard from '../components/ExperimentCard';
import ExperimentsList from '../components/ExperimentsList';
import PropTypes from 'prop-types';

function DashboardOverview({ onNewExperimentClick }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Mevcut deneylerden dinamik olarak durum listesi oluşturur
  const allStatuses = useMemo(() => {
    if (experiments.length === 0) return ['ALL'];
    const statuses = new Set(experiments.map(exp => exp.status));
    return ['ALL', ...Array.from(statuses).sort()];
  }, [experiments]);

  // Deneyleri API'dan çeker ve periyodik olarak günceller
  useEffect(() => {
    const getExperiments = async () => {
      // Sadece ilk yüklemede tam ekran yükleme göstergesi göster
      if (experiments.length === 0) {
          setLoading(true);
      }
      try {
        const response = await fetchExperiments();
        setExperiments(response.data);
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
  }, [experiments.length]); // Sadece ilk yüklemede loading'i tetiklemek için `experiments.length` bağımlılığı

  // Filtrelenmiş ve aranmış deneyleri hesaplar
  const filteredExperiments = useMemo(() => {
    let filtered = experiments;

    // Durum filtresi
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(exp => exp.status === filterStatus);
    }

    // Arama terimi filtresi
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(exp => {
        const config = exp.config || {};
        const results = exp.results || {};
        const pipeline_name = config.pipeline_name || '';
        const ticker = config.data_sourcing?.ticker || '';
        const experiment_id = exp.experiment_id || '';

        return experiment_id.toLowerCase().includes(lowerCaseSearchTerm) ||
               pipeline_name.toLowerCase().includes(lowerCaseSearchTerm) ||
               ticker.toLowerCase().includes(lowerCaseSearchTerm);
      });
    }
    return filtered;
  }, [experiments, filterStatus, searchTerm]);


  const runningExperiments = filteredExperiments.filter(exp => 
    ['STARTED', 'PROGRESS', 'PENDING'].includes(exp.status)
  );
  
  const completedOrFailedExperiments = filteredExperiments.filter(exp => 
    !runningExperiments.some(runningExp => runningExp.experiment_id === exp.experiment_id)
  );

  if (loading) {
    return <p className="feedback info">Veriler yükleniyor...</p>;
  }

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <h1><span role="img" aria-label="dashboard">📊</span> Genel Bakış</h1>
        <p>Tüm deneylerinizin durumunu ve son gelişmelerini takip edin.</p>
      </div>

      {error && <p className="feedback error">{error}</p>}

      {!error && (
        <>
          {/* Filtre ve Arama Alanları */}
          <div className="card" style={{ marginBottom: '25px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px'}}>Deneyleri Filtrele</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: '1 1 250px', minWidth: '200px', marginBottom: 0 }}>
                <label htmlFor="search-term">Arama</label>
                <input 
                  type="text" 
                  id="search-term" 
                  placeholder="ID, Pipeline, Sembol ara..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', minWidth: '150px', marginBottom: 0 }}>
                <label htmlFor="filter-status">Durum</label>
                <select 
                  id="filter-status" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
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
          {runningExperiments.length > 0 ? (
            <div className="running-experiments-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '25px'
            }}>
              {runningExperiments.map(exp => (
                <ExperimentCard key={exp.experiment_id} experiment={exp} />
              ))}
            </div>
          ) : (
            <p className="feedback info">Şu anda çalışan bir deney bulunmamaktadır. <button onClick={onNewExperimentClick} className="button-link" style={{background: 'none', border: 'none', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer', fontSize: '1em', padding: 0}}>Yeni bir deney başlatmak</button> ister misiniz?</p>
          )}

          <h2 className="section-title" style={{marginTop: '40px'}}>
            <span role="img" aria-label="history">🗂️</span>
            Deney Geçmişi ({completedOrFailedExperiments.length})
          </h2>
          {completedOrFailedExperiments.length > 0 ? (
            <ExperimentsList experiments={completedOrFailedExperiments} />
          ) : (
            <p className="feedback info">Henüz tamamlanan veya başarısız olan bir deney bulunmamaktadır.</p>
          )}
        </>
      )}
    </div>
  );
}

DashboardOverview.propTypes = {
  onNewExperimentClick: PropTypes.func.isRequired,
};

export default DashboardOverview;