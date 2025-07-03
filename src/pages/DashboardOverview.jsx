import { useState, useEffect, useMemo, useCallback } from 'react';
import ExperimentCard from '../components/ExperimentCard';
import BatchCard from '../components/BatchCard';
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

  const getExperiments = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const response = await fetchExperiments();
      setExperiments(response.data); 
      setError(null);
    } catch (err) {
      setError('API sunucusuna bağlanılamadı veya veri çekilemedi.');
      console.error(err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []);

  useEffect(() => {
    getExperiments(true);
    const intervalId = setInterval(() => getExperiments(false), 10000);
    return () => clearInterval(intervalId);
  }, [getExperiments]);

  const groupedAndFilteredExperiments = useMemo(() => {
    // Önce filtrele
    const filtered = experiments.filter(exp => {
        const statusMatch = filterStatus === 'ALL' || exp.status === filterStatus;
        if (!statusMatch) return false;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            return [exp.experiment_id, exp.pipeline_name, exp.config_summary?.ticker, exp.batch_name]
                .some(field => field && field.toLowerCase().includes(lowerTerm));
        }
        return true;
    });

    // Sonra grupla
    const batches = {};
    const singleExperiments = [];

    filtered.forEach(exp => {
      const experimentWithSelection = { ...exp, isSelected: selectedForComparison.has(exp.experiment_id) };
      if (exp.batch_id) {
        if (!batches[exp.batch_id]) {
          batches[exp.batch_id] = {
            batch_id: exp.batch_id,
            batch_name: exp.batch_name,
            experiments: []
          };
        }
        batches[exp.batch_id].experiments.push(experimentWithSelection);
      } else {
        singleExperiments.push(experimentWithSelection);
      }
    });

    // Her batch içindeki deneyleri tarihe göre sırala
    Object.values(batches).forEach(batch => {
      batch.experiments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });

    return [...Object.values(batches), ...singleExperiments];
  }, [experiments, filterStatus, searchTerm, selectedForComparison]);
  
  const handleComparisonSelect = useCallback((experimentId) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      newSelection.has(experimentId) ? newSelection.delete(experimentId) : newSelection.add(experimentId);
      return newSelection;
    });
  }, []);

  const handleStartComparison = useCallback(() => { 
    // ... (Bu fonksiyon aynı kalıyor, değişiklik yok)
  }, [selectedForComparison, experiments]);

  if (loading) return <p style={{textAlign: 'center', padding: '40px'}}>Yükleniyor...</p>;
  if (error) return <p style={{textAlign: 'center', padding: '40px', color: 'var(--error-color)'}}>{error}</p>;

  return (
    <div className="dashboard-overview">
      {comparisonData && <ComparisonView experiments={comparisonData} onClose={() => setComparisonData(null)}/>}
      
      <div className="page-header">
        <h1>Deney Paneli</h1>
        <p>Tüm deneylerinizi tek bir yerden yönetin, takip edin ve karşılaştırın.</p>
      </div>
      
      <div className="card" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{display: 'flex', gap: '20px'}}>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="search-term">Arama</label>
                <input type="text" id="search-term" placeholder="ID, Pipeline, Sembol, Grup ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{minWidth: '250px'}} />
            </div>
        </div>
        <button 
          className="button-primary" 
          onClick={handleStartComparison} 
          disabled={selectedForComparison.size < 2}
        >
          Seçilenleri Karşılaştır ({selectedForComparison.size})
        </button>
      </div>
      
      <div className="experiments-list-container"> 
        {groupedAndFilteredExperiments.length === 0 ? (
          <p style={{textAlign: 'center', padding: '20px'}}>Filtrelerinize uyan bir deney bulunamadı.</p>
        ) : (
          groupedAndFilteredExperiments.map((item) => (
            item.batch_id 
              ? <BatchCard key={item.batch_id} batch={item} onSelect={handleComparisonSelect} />
              : <ExperimentCard key={item.experiment_id} experiment={item} isSelected={item.isSelected} onSelect={() => handleComparisonSelect(item.experiment_id)} />
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardOverview;