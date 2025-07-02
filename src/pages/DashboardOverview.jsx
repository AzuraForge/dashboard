import { useState, useEffect, useMemo, useCallback } from 'react'; 
import ExperimentCard from '../components/ExperimentCard'; 
import ComparisonView from '../components/ComparisonView';
import { fetchExperiments } from '../services/api'; 
import { toast } from 'react-toastify'; 

function DashboardOverview() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [comparisonData, setComparisonData] = useState(null);

  // API'den tüm deney verilerini tek çağrıda çekiyoruz
  const getExperiments = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const response = await fetchExperiments();
      setExperiments(response.data); 
      setError(null);
    } catch (err) {
      setError('API sunucusuna bağlanılamadı veya veri çekilemedi. Servislerin çalıştığından emin olun.');
      console.error(err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []); 

  useEffect(() => {
    getExperiments(true);
    const intervalId = setInterval(() => getExperiments(false), 20000); // <--- BU SATIR DEĞİŞTİ (Polling süresi artırıldı)!
    return () => clearInterval(intervalId);
  }, [getExperiments]); 

  const allStatuses = useMemo(() => {
    const statuses = new Set(experiments.map(exp => exp.status));
    return ['ALL', ...Array.from(statuses).sort()];
  }, [experiments]);

  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      const statusMatch = filterStatus === 'ALL' || exp.status === filterStatus;
      if (!statusMatch) return false;

      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const searchFields = [
          exp.experiment_id,
          exp.pipeline_name,
          exp.config_summary?.ticker, 
          exp.batch_name,
        ];
        return searchFields.some(field => typeof field === 'string' && field.toLowerCase().includes(lowerCaseSearchTerm));
      }

      return true;
    });
  }, [experiments, filterStatus, searchTerm]);
  
  const handleComparisonSelect = useCallback((experimentId) => { 
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(experimentId)) {
        newSelection.delete(experimentId);
      } else {
        newSelection.add(experimentId);
      }
      return newSelection;
    });
  }, []); 

  const handleStartComparison = useCallback(async () => { 
    const idsToCompare = Array.from(selectedForComparison);
    if (idsToCompare.length < 2) {
        toast.warn('Karşılaştırma için en az 2 deney seçmelisiniz.');
        return;
    }
    
    const dataToCompare = idsToCompare.map(id => 
        experiments.find(exp => exp.experiment_id === id)
    ).filter(Boolean); 

    // KRİTİK DÜZELTME: Karşılaştırma için sadece kayıp geçmişi olan deneyleri filtrele.
    // Durumun 'SUCCESS' olması zorunlu değil, çünkü 'FAILURE' olsa bile grafiği çizilebilir.
    const validDataForComparison = dataToCompare.filter(exp => 
        exp.results?.history?.loss && exp.results.history.loss.length > 0
    );

    if (validDataForComparison.length < 2) {
        toast.warn('Karşılaştırma için en az 2 adet, kayıp geçmişi olan deney seçmelisiniz.');
        setComparisonData(null); 
        return;
    }

    setComparisonData(validDataForComparison);
  }, [selectedForComparison, experiments]); 

  if (loading) return <p style={{textAlign: 'center', padding: '40px'}}>Deney verileri yükleniyor...</p>;
  if (error) return <p style={{textAlign: 'center', padding: '40px', color: 'var(--error-color)'}}>{error}</p>;

  return (
    <div className="dashboard-overview">
      {comparisonData && <ComparisonView experiments={comparisonData} onClose={() => setComparisonData(null)}/>}
      
      <div className="page-header">
        <h1>Genel Bakış</h1>
        <p>Tüm deneylerinizi tek bir yerden yönetin, takip edin ve karşılaştırın.</p>
      </div>
      
      <div className="card" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="search-term">Arama</label>
            <input type="text" id="search-term" placeholder="ID, Pipeline, Sembol ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-status">Durum</label>
            <select id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {allStatuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Tümü' : s}</option>)}
            </select>
          </div>
        </div>
        <button 
          className="button-primary" 
          onClick={handleStartComparison} 
          disabled={selectedForComparison.size < 2} 
          title={selectedForComparison.size < 2 ? 'Karşılaştırmak için en az 2 deney seçin' : ''}
        >
          <span role="img" aria-label="scales">⚖️</span> Seçilenleri Karşılaştır ({selectedForComparison.size})
        </button>
      </div>
      
      <div className="experiments-list-container"> 
        {filteredExperiments.length === 0 ? (
          <p style={{textAlign: 'center', padding: '20px'}}>Filtrelerinize uyan bir deney bulunamadı.</p>
        ) : (
          filteredExperiments.map((exp) => (
            <ExperimentCard 
              key={exp.experiment_id} 
              experiment={exp} 
              isSelected={selectedForComparison.has(exp.experiment_id)}
              onSelect={() => handleComparisonSelect(exp.experiment_id)} 
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardOverview;