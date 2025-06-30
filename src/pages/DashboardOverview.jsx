import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import ExperimentsList from '../components/ExperimentsList';
import ComparisonView from '../components/ComparisonView';
import { fetchExperiments, fetchExperimentDetails } from '../services/api';

function DashboardOverview({ setTrackingTaskId }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [comparisonData, setComparisonData] = useState(null);

  const getExperiments = async (showLoadingIndicator = false) => {
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
  };

  useEffect(() => {
    getExperiments(true);
    const intervalId = setInterval(() => getExperiments(false), 5000);
    return () => clearInterval(intervalId);
  }, []);

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
        return searchFields.some(field => field?.toLowerCase().includes(lowerCaseSearchTerm));
      }

      return true;
    });
  }, [experiments, filterStatus, searchTerm]);
  
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

  const handleStartComparison = async () => {
    const idsToCompare = Array.from(selectedForComparison);
    if (idsToCompare.length < 2) return;
    
    setComparisonData([]); // Show loading state in modal
    try {
      const promises = idsToCompare.map(id => fetchExperimentDetails(id));
      const responses = await Promise.all(promises);
      const dataToCompare = responses.map(res => res.data);
      setComparisonData(dataToCompare);
    } catch (error) {
      console.error("Karşılaştırma verileri çekilemedi:", error);
      setComparisonData(null); // Hide modal on error
    }
  };

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
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
      </div>
      
      <ExperimentsList 
        experiments={filteredExperiments} 
        selectedIds={selectedForComparison} 
        onSelect={handleComparisonSelect} 
        setTrackingTaskId={setTrackingTaskId}
      />
    </div>
  );
}

DashboardOverview.propTypes = { 
  setTrackingTaskId: PropTypes.func.isRequired, 
};

export default DashboardOverview;