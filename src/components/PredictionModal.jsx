// dashboard/src/components/PredictionModal.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

function PredictionModal({ model, onClose }) {
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth(); // Kimlik doğrulama için token'ı al

  // Modelin zaman serisi olup olmadığını kontrol et
  const isTimeSeries = model.pipeline_name.includes('forecaster') || model.pipeline_name.includes('predictor');

  const handlePredict = async () => {
    setIsLoading(true);
    setPredictionResult(null);

    try {
      // Zaman serisi modelleri için artık boş bir body gönderiyoruz.
      // Diğer modeller için (eğer ileride eklenirse) veri gerekebilir.
      const payload = isTimeSeries ? {} : { data: [] };

      const response = await axios.post(`${API_BASE_URL}/experiments/${model.experiment_id}/predict`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPredictionResult(response.data);
    } catch (error) {
      handleApiError(error, "tahmin yapma");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Anlık Tahmin</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>
        <div className={styles.body}>
          {isTimeSeries ? (
            <p>
              <b>{model.pipeline_name}</b> modeli, eğitimde kullanılan verilerin sonunu baz alarak 
              bir sonraki zaman adımını otomatik olarak tahmin edecektir.
              <br/><br/>
              Devam etmek için "Tahmin Et" butonuna tıklayın.
            </p>
          ) : (
            <p>
              Bu model için anlık tahmin özelliği henüz yapılandırılmamıştır.
            </p>
          )}

          {isLoading && <p style={{textAlign: 'center', color: 'var(--text-color-darker)'}}>Tahmin yapılıyor...</p>}

          {predictionResult && (
            <div className={styles.result}>
              <p>Modelin Bir Sonraki Adım İçin Tahmini</p>
              <div className={styles.predictionValue}>
                {(predictionResult.prediction || 0).toFixed(4)}
              </div>
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <button className={styles.buttonSecondary} onClick={onClose} disabled={isLoading}>İptal</button>
          <button 
            className="button-primary" 
            onClick={handlePredict} 
            disabled={isLoading || !isTimeSeries}
          >
            {isLoading ? 'Hesaplanıyor...' : 'Tahmin Et'}
          </button>
        </footer>
      </div>
    </div>
  );
}

PredictionModal.propTypes = {
  model: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// API çağrısında Auth header'ı gönderebilmek için useAuth hook'unu import ettik.
// Bu yüzden PredictionModal'ı çağıran yere (ModelRegistry.jsx) AuthProvider
// kapsamında olduğundan emin olmalıyız. Zaten App.jsx'te tüm uygulama
// AuthProvider ile sarmalanmış durumda, bu yüzden ek bir değişiklik gerekmiyor.

export default PredictionModal;