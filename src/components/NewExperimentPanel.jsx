// dashboard/src/components/NewExperimentPanel.jsx

import React from 'react';
import PropTypes from 'prop-types';
import NewExperimentFormContent from '../pages/NewExperiment';
// YENİ: CSS Modülü yerine standart CSS importu
import './NewExperimentPanel.css'; 

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
      // Panelin içeriğine focus vermek için
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

  // isOpen durumuna göre class'ları dinamik olarak ata
  const overlayClasses = `panel-overlay ${isOpen ? 'open' : ''}`;
  const panelClasses = `panel ${isOpen ? 'open' : ''}`;

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
        <div className="panel-header">
          <h2 id="new-experiment-title">Yeni Deney Başlat</h2>
          <button className="close-button" onClick={onClose} title="Kapat (Esc)">
            <CloseIcon />
          </button>
        </div>
        <div className="panel-body">
          {/* Form içeriği artık bir prop alarak panelin kapandığını bilecek */}
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