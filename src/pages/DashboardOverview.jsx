import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

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
    const filtered = experiments.filter(exp => {
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            return [exp.experiment_id, exp.pipeline_name, exp.config_summary?.ticker, exp.batch_name]
                .some(field => field && String(field).toLowerCase().includes(lowerTerm));
        }
        return true;
    });

    const batches = {};
    const singleExperiments = [];

    filtered.forEach(exp => {
      const experimentWithSelection = { ...exp, isSelected: selectedForComparison.has(exp.experiment_id) };
      if (exp.batch_id) {
        if (!batches[exp.batch_id]) {
          batches[exp.batch_id] = { batch_id: exp.batch_id, batch_name: exp.batch_name, experiments: [] };
        }
        batches[exp.batch_id].experiments.push(experimentWithSelection);
      } else {
        singleExperiments.push(experimentWithSelection);
      }
    });

    Object.values(batches).forEach(batch => {
      batch.experiments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });

    const sortedBatches = Object.values(batches).sort((a,b) => new Date(b.experiments[0].created_at) - new Date(a.experiments[0].created_at));

    return [...sortedBatches, ...singleExperiments];
  }, [experiments, searchTerm, selectedForComparison]);
  
  const handleComparisonSelect = useCallback((experimentId) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      newSelection.has(experimentId) ? newSelection.delete(experimentId) : newSelection.add(experimentId);
      return newSelection;
    });
  }, []);

  const comparisonData = useMemo(() => {
    return experiments.filter(exp => selectedForComparison.has(exp.experiment_id));
  }, [selectedForComparison, experiments]);

  const handleStartComparison = useCallback(() => { 
    if (comparisonData.length < 2) {
        toast.warn('Karşılaştırma için en az 2 deney seçmelisiniz.');
        return;
    }
    setIsComparisonModalOpen(true);
  }, [comparisonData]);

  if (loading) return <p style={{textAlign: 'center', padding: '40px'}}>Yükleniyor...</p>;
  if (error) return <p style={{textAlign: 'center', padding: '40px', color: 'var(--error-color)'}}>{error}</p>;

  return (
    <div className="dashboard-overview">
      {isComparisonModalOpen && (
        <ComparisonView
          experiments={comparisonData}
          title="Seçilen Deneylerin Karşılaştırması"
          showCloseButton={true}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}
      
      <div className="page-header">
        <h1>Deney Paneli</h1>
        <p>Tüm deneylerinizi tek bir yerden yönetin, takip edin ve karşılaştırın.</p>
      </div>
      
      <div className="card" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
            <label htmlFor="search-term">Arama</label>
            <input type="text" id="search-term" placeholder="ID, Pipeline, Sembol, Grup ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{minWidth: '250px'}} />
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