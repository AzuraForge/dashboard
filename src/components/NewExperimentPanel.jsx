import React from 'react';
import PropTypes from 'prop-types';
import NewExperimentFormContent from '../pages/NewExperiment';
// DÜZELTME: Tutarlılık için CSS Modülü'ne geçildi.
import styles from './NewExperimentPanel.module.css';

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function NewExperimentPanel({ isOpen, onClose, onExperimentStarted }) {
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => panelRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const overlayClasses = `${styles.panelOverlay} ${isOpen ? styles.open : ''}`;
  const panelClasses = `${styles.panel} ${isOpen ? styles.open : ''}`;

  return (
    <div className={overlayClasses} onClick={handleOverlayClick}>
      <div 
        ref={panelRef} 
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-experiment-title"
        tabIndex="-1" 
      >
        <div className={styles.panelHeader}>
          <h2 id="new-experiment-title">Yeni Deney Başlat</h2>
          <button className={styles.closeButton} onClick={onClose} title="Kapat (Esc)">
            <CloseIcon />
          </button>
        </div>
        <div className={styles.panelBody}>
          <NewExperimentFormContent 
            onExperimentStarted={onExperimentStarted} 
          />
        </div>
      </div>
    </div>
  );
}

NewExperimentPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExperimentStarted: PropTypes.func.isRequired,
};

export default NewExperimentPanel;