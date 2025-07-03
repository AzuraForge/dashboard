import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import ExperimentCard from './ExperimentCard';
import styles from './BatchCard.module.css';

const ChevronDownIcon = ({ className = '' }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
ChevronDownIcon.propTypes = { className: PropTypes.string };

function BatchCard({ batch, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const batchStatus = useMemo(() => {
    const statuses = new Set(batch.experiments.map(e => e.status));
    if (statuses.has('STARTED') || statuses.has('PROGRESS')) return 'ÇALIŞIYOR';
    if (statuses.has('PENDING') && statuses.size === 1) return 'BEKLEMEDE';
    if (statuses.has('FAILURE')) return 'HATALI';
    if (Array.from(statuses).every(s => s === 'SUCCESS')) return 'TAMAMLANDI';
    return 'KARIŞIK';
  }, [batch.experiments]);
  
  const statusClass = {
    'ÇALIŞIYOR': styles.running,
    'TAMAMLANDI': styles.success,
    'HATALI': styles.failure,
    'BEKLEMEDE': styles.pending
  }[batchStatus] || styles.mixed;

  return (
    <div className={styles.batchContainer}>
      <header className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
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
        <div className={styles.experimentsList}>
          {batch.experiments.map(exp => (
            <ExperimentCard
              key={exp.experiment_id}
              experiment={exp}
              isSelected={exp.isSelected}
              onSelect={() => onSelect(exp.experiment_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

BatchCard.propTypes = {
  batch: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default BatchCard;