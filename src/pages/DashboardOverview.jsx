import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

import ExperimentCard from '../components/ExperimentCard';
import BatchCard from '../components/BatchCard';
import ComparisonView from '../components/ComparisonView';
import ReportModal from '../components/ReportModal';
import { fetchExperiments } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './DashboardOverview.module.css';

// --- YENİ: Yüzen Karşılaştırma Butonu Bileşeni ---
function FloatingCompareButton({ count, onClick }) {
    if (count < 1) return null;
    return (
        <button className={styles.floatingCompareButton} onClick={onClick}>
            <span role="img" aria-label="compare">🔀</span> Karşılaştır ({count})
        </button>
    );
}
FloatingCompareButton.propTypes = {
    count: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
};

// --- DEĞİŞİKLİK: ComparisonBasket bileşeni artık DashboardOverview içinde ---
function ComparisonBasket({ selectedExperiments, onStartComparison, onClear, onRemove }) {
    return (
        <div className={styles.basket}>
            <h3 className={styles.basketTitle}>Karşılaştırma Sepeti</h3>
            {selectedExperiments.length === 0 ? (
                <p className={styles.basketEmpty}>Karşılaştırmak için deneyler seçin.</p>
            ) : (
                <>
                    <ul className={styles.basketList}>
                        {selectedExperiments.map(exp => (
                            <li key={exp.experiment_id}>
                                <div className={styles.basketItemInfo}>
                                    {exp.pipeline_name}
                                    <span>ID: {exp.experiment_id.slice(0, 8)}...</span>
                                </div>
                                <button onClick={() => onRemove(exp.experiment_id)} className={styles.basketItemRemove}>×</button>
                            </li>
                        ))}
                    </ul>
                    <div className={styles.basketActions}>
                        <button className={styles.clearButton} onClick={onClear}>Tümünü Temizle</button>
                        <button 
                            className="button-primary" 
                            onClick={onStartComparison}
                            disabled={selectedExperiments.length < 2}
                        >
                            Karşılaştır ({selectedExperiments.length})
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
ComparisonBasket.propTypes = {
    selectedExperiments: PropTypes.array.isRequired,
    onStartComparison: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
};


function DashboardOverview() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [viewingReportId, setViewingReportId] = useState(null);

  // --- YENİ: Modal açıkken body'e class ekleme/kaldırma ---
  useEffect(() => {
    const isModalOpen = isComparisonModalOpen || !!viewingReportId;
    if (isModalOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
    // Cleanup function
    return () => document.body.classList.remove('modal-open');
  }, [isComparisonModalOpen, viewingReportId]);

  const getExperiments = useCallback(async (showLoadingIndicator = false) => {
    // ... Bu fonksiyon değişmedi ...
  }, []);

  useEffect(() => {
    getExperiments(true);
    const intervalId = setInterval(() => getExperiments(false), 10000);
    return () => clearInterval(intervalId);
  }, [getExperiments]);

  const handleComparisonSelect = useCallback((experimentId) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(experimentId)) newSelection.delete(experimentId);
      else {
        if (newSelection.size >= 8) toast.warn("En fazla 8 deney karşılaştırılabilir.");
        else newSelection.add(experimentId);
      }
      return newSelection;
    });
  }, []);
  
  const comparisonData = useMemo(() => {
      return experiments.filter(exp => selectedForComparison.has(exp.experiment_id))
          .sort((a, b) => [...selectedForComparison].indexOf(a.experiment_id) - [...selectedForComparison].indexOf(b.experiment_id));
  }, [selectedForComparison, experiments]);

  const groupedAndFilteredExperiments = useMemo(() => {
    // ... Bu fonksiyon değişmedi ...
  }, [experiments, searchTerm, selectedForComparison]);
  
  const handleStartComparison = useCallback(() => { 
    if (comparisonData.length < 2) {
        toast.warn('Karşılaştırma için en az 2 deney seçmelisiniz.');
        return;
    }
    setIsComparisonModalOpen(true);
  }, [comparisonData]);

  const handleClearComparison = useCallback(() => { setSelectedForComparison(new Set()); }, []);

  if (loading) return <div className={styles.stateMessage}>Yükleniyor...</div>;
  if (error) return <div className={`${styles.stateMessage} ${styles.errorMessage}`}>{error}</div>;

  return (
    <>
      {isComparisonModalOpen && <ComparisonView experiments={comparisonData} title="Seçilen Deneylerin Karşılaştırması" showCloseButton={true} onClose={() => setIsComparisonModalOpen(false)} />}
      {viewingReportId && <ReportModal experimentId={viewingReportId} onClose={() => setViewingReportId(null)} />}
      
      {/* --- YENİ: Yüzen buton sadece dar ekranlarda görünür --- */}
      <FloatingCompareButton count={comparisonData.length} onClick={handleStartComparison} />
      
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
                {groupedAndFilteredExperiments.length === 0 ? (
                    <div className="card" style={{textAlign: 'center', padding: '2rem'}}><p>Filtrelerinize Uyan Bir Deney Bulunamadı.</p></div>
                ) : (
                    groupedAndFilteredExperiments.map((item) => (
                        item.batch_id 
                        ? <BatchCard key={item.batch_id} batch={item} onSelect={handleComparisonSelect} onShowReport={setViewingReportId} />
                        : <ExperimentCard key={item.experiment_id} experiment={item} isSelected={item.isSelected} onSelect={() => handleComparisonSelect(item.experiment_id)} onShowReport={setViewingReportId}/>
                    ))
                )}
            </div>
        </div>
        
        {/* --- DEĞİŞİKLİK: Kenar çubuğu artık sadece geniş ekranlarda görünür --- */}
        <aside className={styles.sidebarColumn}>
            <ComparisonBasket 
                selectedExperiments={comparisonData} 
                onStartComparison={handleStartComparison}
                onClear={handleClearComparison}
                onRemove={handleComparisonSelect}
            />
        </aside>
      </div>
    </>
  );
}

export default DashboardOverview;