// dashboard/src/components/NewExperimentPanel.jsx

import React from 'react';
import PropTypes from 'prop-types';
// NewExperiment artık sadece form içeriği, sayfa başlığı kaldırıldı
import NewExperimentFormContent from '../pages/NewExperiment'; 

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
    if (isOpen && panelRef.current) {
      // Panelin içeriğine veya ilk inputa focus vermek için
      panelRef.current.focus(); 
    }
  }, [isOpen]);

  // Overlay'e tıklanınca paneli kapatma (event propagation'ı durdurmak için)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`new-experiment-panel-overlay ${isOpen ? 'open' : ''}`} onClick={handleOverlayClick}>
      <div 
        ref={panelRef} 
        className={`new-experiment-panel ${isOpen ? 'open' : ''}`}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        tabIndex="-1" 
      >
        <div className="new-experiment-panel-header">
          <h2>Yeni Deney Başlat</h2>
          <button className="close-button" onClick={onClose} title="Kapat">
            <CloseIcon />
          </button>
        </div>
        <div className="new-experiment-panel-body">
          <NewExperimentFormContent 
            onExperimentStarted={onExperimentStarted} 
            onClosePanel={onClose} 
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