import { useState, useEffect, useMemo } from 'react';
import { fetchExperiments, startNewExperiment } from '../services/api';
import ExperimentsList from '../components/ExperimentsList';
import ComparisonView from '../components/ComparisonView'; // YENİ: Karşılaştırma bileşeni
import { toast } from 'react-toastify'; // YENİ: Bildirimler için
import PropTypes from 'prop-types';

function DashboardOverview({ onNewExperimentClick, setTrackingTaskId }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // YENİ: Filtreleme ve Karşılaştırma için state'ler
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [comparisonData, setComparisonData] = useState(null);

  const allStatuses = useMemo(() => {
    if (experiments.length === 0) return ['ALL'];
    const statuses = new Set(experiments.map(exp => exp.status));
    return ['ALL', ...Array.from(statuses).sort()];
  }, [experiments]);

  const getExperiments = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const response = await fetchExperiments();
      // YENİ: Gelen veriyi başlangıç zamanına göre sırala
      const sortedData = response.data.sort((a, b) => 
        new Date(b.config.start_time) - new Date(a.config.start_time)
      );
      setExperiments(sortedData);
      setError(null);
    } catch (err) {
      setError('API sunucusuna bağlanılamadı veya veri çekilemedi.');
      console.error("Error fetching experiments:", err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  useEffect(() => {
    getExperiments(true); // İlk yüklemede loading göster
    const intervalId = setInterval(() => getExperiments(false), 5000); 
    return () => clearInterval(intervalId);
  }, []);

  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      const statusMatch = filterStatus === 'ALL' || exp.status === filterStatus;
      if (!statusMatch) return false;

      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (exp.experiment_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
                exp.config?.pipeline_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
                exp.config?.data_sourcing?.ticker?.toLowerCase().includes(lowerCaseSearchTerm));
      }
      return true;
    });
  }, [experiments, filterStatus, searchTerm]);
  
  // YENİ: Karşılaştırma için seçimi yöneten fonksiyon
  const handleComparisonSelect = (experimentId) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(experimentId)) {
        newSelection.delete(experimentId);
      } else {
        newSelection.add(experimentId);
      }
      return newSelection;
    });
  };

  // YENİ: Deneyi yeniden çalıştıran fonksiyon
  const handleReRun = async (experimentConfig) => {
    const configToReRun = { ...experimentConfig };
    // Eski ID ve zaman bilgilerini temizle
    delete configToReRun.experiment_id;
    delete configToReRun.task_id;
    delete configToReRun.start_time;

    toast.info(`"${configToReRun.pipeline_name}" deneyi yeniden başlatılıyor...`);
    try {
      const response = await startNewExperiment(configToReRun);
      const taskId = response.data.task_id;
      toast.success(`Deney başarıyla gönderildi! ID: ${taskId}`);
      setTrackingTaskId(taskId); // Canlı takibi başlat
    } catch (err) {
      toast.error('Deney yeniden başlatılamadı.');
    }
  };

  // YENİ: Karşılaştırma panelini açan fonksiyon
  const handleStartComparison = () => {
    const dataToCompare = experiments.filter(exp => selectedForComparison.has(exp.experiment_id));
    setComparisonData(dataToCompare);
  };


  if (loading) return <p className="feedback info">Deney verileri yükleniyor...</p>;

  return (
    <div className="dashboard-overview">
      {/* YENİ: Karşılaştırma paneli (modal) */}
      {comparisonData && (
        <ComparisonView
          experiments={comparisonData}
          onClose={() => setComparisonData(null)}
        />
      )}

      <div className="page-header">
        <h1><span role="img" aria-label="dashboard">📊</span> Genel Bakış</h1>
        <p>Tüm deneylerinizin durumunu, geçmişini ve performansını karşılaştırın.</p>
      </div>

      {error && <p className="feedback error">{error}</p>}

      {!error && (
        <>
          <div className="card" style={{ marginBottom: '25px', padding: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ marginTop: 0, border: 'none', padding: 0 }}>Deney Geçmişi ({filteredExperiments.length})</h3>
                 {/* YENİ: Karşılaştırma butonu */}
                <button 
                  className="button-primary"
                  onClick={handleStartComparison}
                  disabled={selectedForComparison.size < 2}
                  title={selectedForComparison.size < 2 ? 'Karşılaştırmak için en az 2 deney seçin' : ''}
                >
                  <span role="img" aria-label="scales">⚖️</span> Seçilenleri Karşılaştır ({selectedForComparison.size})
                </button>
             </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div className="form-group" style={{ flex: '1 1 250px', minWidth: '200px', marginBottom: 0 }}>
                <label htmlFor="search-term">Arama (ID, Pipeline, Sembol)</label>
                <input type="text" id="search-term" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', minWidth: '150px', marginBottom: 0 }}>
                <label htmlFor="filter-status">Durum</label>
                <select id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  {allStatuses.map(status => <option key={status} value={status}>{status === 'ALL' ? 'Tümü' : status}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          {filteredExperiments.length > 0 ? (
            <ExperimentsList 
              experiments={filteredExperiments}
              selectedIds={selectedForComparison}
              onSelect={handleComparisonSelect}
              onReRun={handleReRun}
              setTrackingTaskId={setTrackingTaskId}
            />
          ) : (
            <p className="feedback info">Filtrelerinize uyan bir deney bulunamadı. <button onClick={onNewExperimentClick} className="button-link" style={{background: 'none', border: 'none', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer', fontSize: '1em', padding: 0}}>Yeni bir deney başlatmak</button> ister misiniz?</p>
          )}
        </>
      )}
    </div>
  );
}

DashboardOverview.propTypes = {
  onNewExperimentClick: PropTypes.func.isRequired,
  setTrackingTaskId: PropTypes.func.isRequired,
};

export default DashboardOverview;