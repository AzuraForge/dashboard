import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

import ExperimentCard from '../components/ExperimentCard';
import BatchCard from '../components/BatchCard';
import ComparisonView from '../components/ComparisonView';
import ReportModal from '../components/ReportModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchExperiments } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './DashboardOverview.module.css';

// ... (FloatingCompareButton ve ComparisonBasket bileşenleri aynı kalıyor) ...
function FloatingCompareButton({ count, onClick }) { if (count < 1) return null; return ( <button className={styles.floatingCompareButton} onClick={onClick}> <span role="img" aria-label="compare">🔀</span> Karşılaştır ({count}) </button> ); }
FloatingCompareButton.propTypes = { count: PropTypes.number.isRequired, onClick: PropTypes.func.isRequired, };
function ComparisonBasket({ selectedExperiments, onStartComparison, onClear, onRemove }) { return ( <div className={styles.basket}> <h3 className={styles.basketTitle}>Karşılaştırma Sepeti</h3> {selectedExperiments.length === 0 ? ( <p className={styles.basketEmpty}>Karşılaştırmak için deneyler seçin.</p> ) : ( <> <ul className={styles.basketList}> {selectedExperiments.map(exp => ( <li key={exp.experiment_id}> <div className={styles.basketItemInfo}> {exp.pipeline_name} <span>ID: {exp.experiment_id.slice(0, 8)}...</span> </div> <button onClick={() => onRemove(exp.experiment_id)} className={styles.basketItemRemove}>×</button> </li> ))} </ul> <div className={styles.basketActions}> <button className={styles.clearButton} onClick={onClear}>Tümünü Temizle</button> <button className="button-primary" onClick={onStartComparison} disabled={selectedExperiments.length < 2} > Karşılaştır ({selectedExperiments.length}) </button> </div> </> )} </div> ); }
ComparisonBasket.propTypes = { selectedExperiments: PropTypes.array.isRequired, onStartComparison: PropTypes.func.isRequired, onClear: PropTypes.func.isRequired, onRemove: PropTypes.func.isRequired, };


function DashboardOverview() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  
  // === DEĞİŞİKLİK: Modal state yönetimini ayırıyoruz ===
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonModalData, setComparisonModalData] = useState({ experiments: [], title: '' });
  // === DEĞİŞİKLİK SONU ===

  const [viewingReportId, setViewingReportId] = useState(null);

  useEffect(() => {
    // ... (veri çekme useEffect'i aynı kalıyor) ...
    let isMounted = true;
    const loadExperiments = async (showLoadingIndicator) => {
      if (showLoadingIndicator) setLoading(true);
      try {
        const response = await fetchExperiments();
        if (isMounted) {
          setExperiments(Array.isArray(response.data) ? response.data : []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          handleApiError(err, 'deneyleri yükleme');
          setError('API sunucusuna bağlanılamadı veya veri çekilemedi.');
        }
      } finally {
        if (isMounted && showLoadingIndicator) {
          setLoading(false);
        }
      }
    };
    loadExperiments(true);
    const intervalId = setInterval(() => loadExperiments(false), 10000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  const handleComparisonSelect = useCallback((experimentId) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(experimentId)) newSelection.delete(experimentId);
      else { if (newSelection.size >= 8) toast.warn("En fazla 8 deney karşılaştırılabilir."); else newSelection.add(experimentId); }
      return newSelection;
    });
  }, []);
  
  const comparisonData = useMemo(() => {
      if (!Array.isArray(experiments)) return [];
      return experiments.filter(exp => selectedForComparison.has(exp.experiment_id))
          .sort((a, b) => [...selectedForComparison].indexOf(a.experiment_id) - [...selectedForComparison].indexOf(b.experiment_id));
  }, [selectedForComparison, experiments]);

  const groupedAndFilteredExperiments = useMemo(() => {
    if (!Array.isArray(experiments)) return [];
    const filtered = experiments.filter(exp => {
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            return [exp.experiment_id, exp.pipeline_name, exp.config_summary?.ticker, exp.batch_name].some(field => field && String(field).toLowerCase().includes(lowerTerm));
        }
        return true;
    });
    const batches = {}; const singleExperiments = [];
    filtered.forEach(exp => {
      const experimentWithSelection = { ...exp, isSelected: selectedForComparison.has(exp.experiment_id) };
      if (exp.batch_id) {
        if (!batches[exp.batch_id]) batches[exp.batch_id] = { batch_id: exp.batch_id, batch_name: exp.batch_name, experiments: [] };
        batches[exp.batch_id].experiments.push(experimentWithSelection);
      } else singleExperiments.push(experimentWithSelection);
    });
    Object.values(batches).forEach(batch => batch.experiments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    const sortedBatches = Object.values(batches).sort((a,b) => new Date(b.experiments[0].created_at) - new Date(a.created_at));
    return [...sortedBatches, ...singleExperiments];
  }, [experiments, searchTerm, selectedForComparison]);

  // === DEĞİŞİKLİK: Modal açma fonksiyonları birleştirildi ===
  const openComparisonModal = (experiments, title) => {
    if (experiments.length < 2 && title.includes("Seçilen")) {
      toast.warn('Karşılaştırma için en az 2 deney seçmelisiniz.');
      return;
    }
    setComparisonModalData({ experiments, title });
    setIsComparisonModalOpen(true);
  };
  
  const handleStartManualComparison = () => openComparisonModal(comparisonData, "Seçilen Deneylerin Karşılaştırması");
  const handleStartBatchComparison = (batchExperiments) => openComparisonModal(batchExperiments, "Deney Grubu Sonuçları");
  // === DEĞİŞİKLİK SONU ===

  const handleClearComparison = useCallback(() => { setSelectedForComparison(new Set()); }, []);
  if (loading) return <LoadingSpinner message="Deneyler yükleniyor..." />;
  if (error) return <div className={`${styles.stateMessage} ${styles.errorMessage}`}>{error}</div>;

  return (
    <>
      {isComparisonModalOpen && (
        <ComparisonView
          experiments={comparisonModalData.experiments}
          title={comparisonModalData.title}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}
      {viewingReportId && <ReportModal experimentId={viewingReportId} onClose={() => setViewingReportId(null)} />}
      
      <FloatingCompareButton count={comparisonData.length} onClick={handleStartManualComparison} />
      
      <div className={styles.pageLayout}>
        <div className={styles.mainColumn}>
            <div className="page-header">
                <h1>Deney Paneli</h1>
                <p>Tüm deneylerinizi tek bir yerden yönetin, takip edin ve karşılaştırın.</p>
            </div>
            <div className="form-group" style={{ marginBottom: '25px' }}>
                <input type="text" id="search-term" placeholder="ID, Pipeline, Sembol, Grup veya Etiket ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className={styles.experimentsListContainer}> 
              {groupedAndFilteredExperiments.length > 0 ? (
                  groupedAndFilteredExperiments.map((item) => (
                      item.batch_id 
                      ? <BatchCard key={item.batch_id} batch={item} onSelect={handleComparisonSelect} onShowReport={setViewingReportId} onShowBatchComparison={handleStartBatchComparison} />
                      : <ExperimentCard key={item.experiment_id} experiment={item} isSelected={item.isSelected} onSelect={() => handleComparisonSelect(item.experiment_id)} onShowReport={setViewingReportId}/>
                  ))
              ) : (
                <div className="card" style={{textAlign: 'center', padding: '2rem'}}>
                  <p>Filtrelerinize uyan veya mevcut bir deney bulunamadı.</p>
                </div>
              )}
            </div>
        </div>
        
        <aside className={styles.sidebarColumn}>
            <ComparisonBasket 
                selectedExperiments={comparisonData} 
                onStartComparison={handleStartManualComparison}
                onClear={handleClearComparison}
                onRemove={handleComparisonSelect}
            />
        </aside>
      </div>
    </>
  );
}

export default DashboardOverview;