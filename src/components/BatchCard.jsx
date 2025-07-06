// DOSYA: dashboard/src/components/BatchCard.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import ExperimentCard from './ExperimentCard';
import styles from './BatchCard.module.css';

const ChevronDownIcon = ({ className = '' }) => ( <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> );
ChevronDownIcon.propTypes = { className: PropTypes.string };

// === DEĞİŞİKLİK: Yeni 'onShowBatchAnalysis' prop'u eklendi ===
function BatchCard({ batch, onSelect, onShowReport, onShowBatchComparison, onShowBatchAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const batchStatus = useMemo(() => {
    const statuses = new Set(batch.experiments.map(e => e.status));
    if (statuses.has('STARTED') || statuses.has('PROGRESS')) return 'ÇALIŞIYOR';
    if (statuses.has('PENDING')) return 'BEKLEMEDE';
    if (statuses.has('FAILURE')) return 'HATALI';
    if (Array.from(statuses).every(s => s === 'SUCCESS')) return 'TAMAMLANDI';
    return 'KARIŞIK';
  }, [batch.experiments]);
  
  const statusClass = { 'ÇALIŞIYOR': styles.running, 'TAMAMLANDI': styles.success, 'HATALI': styles.failure, 'BEKLEMEDE': styles.pending, 'KARIŞIK': styles.mixed }[batchStatus];

  const finishedExperiments = useMemo(() => 
    batch.experiments.filter(e => e.status === 'SUCCESS' || e.status === 'FAILURE'), 
  [batch.experiments]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // === DEĞİŞİKLİK: İsimler daha anlaşılır hale getirildi ===
  const handleShowComparison = () => {
    onShowBatchComparison(finishedExperiments);
  }

  // === YENİ: Paralel koordinat grafiği modalını açmak için handler ===
  const handleShowAnalysis = () => {
    onShowBatchAnalysis(finishedExperiments);
  }

  return (
    <div className={`${styles.batchContainer} ${isExpanded ? styles.expanded : ''}`}>
      <header className={styles.header} onClick={handleToggleExpand}>
        <div className={styles.headerLeft}>
          <ChevronDownIcon className={`${styles.icon} ${isExpanded ? '' : styles.collapsed}`} />
          <div className={styles.info}>
            <h2 className={styles.batchName}>{batch.batch_name}</h2>
            <span className={styles.batchMeta}>
              {batch.experiments.length} Deney • ID: {batch.batch_id.slice(0, 8)}...
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.statusBadge} ${statusClass}`}>{batchStatus}</span>
        </div>
      </header>
      
      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.viewToggle}>
            <button className={styles.activeView}>Deney Listesi</button>
            <button onClick={handleShowComparison} disabled={finishedExperiments.length < 2}>
              Sonuçları Karşılaştır (Grafik)
            </button>
            {/* === YENİ: Analiz butonu eklendi === */}
            <button onClick={handleShowAnalysis} disabled={finishedExperiments.length < 2}>
              Grup Analizi (Hiperparametre)
            </button>
          </div>

          <div className={styles.viewContent}>
            <div className={styles.experimentsList}>
              {batch.experiments.map(exp => (
                <ExperimentCard
                  key={exp.experiment_id}
                  experiment={exp}
                  isSelected={exp.isSelected}
                  onSelect={() => onSelect(exp.experiment_id)}
                  onShowReport={onShowReport}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

BatchCard.propTypes = {
  batch: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onShowReport: PropTypes.func.isRequired,
  onShowBatchComparison: PropTypes.func.isRequired,
  onShowBatchAnalysis: PropTypes.func.isRequired, // <-- Yeni prop
};

export default BatchCard;