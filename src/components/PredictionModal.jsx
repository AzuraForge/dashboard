import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios'; // Axios'u doğrudan kullanalım
import { API_BASE_URL } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { toast } from 'react-toastify';

function PredictionModal({ model, onClose }) {
  const [inputData, setInputData] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    let parsedData;
    if (!inputData) {
      toast.warn("Lütfen tahmin için JSON verisi girin.");
      return;
    }

    try {
      parsedData = JSON.parse(inputData);
    } catch (error) {
      toast.error("Geçersiz JSON formatı. Lütfen veriyi kontrol edin.");
      return;
    }

    setIsLoading(true);
    setPredictionResult(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/experiments/${model.experiment_id}/predict`, {
        data: parsedData,
      });
      setPredictionResult(response.data);
    } catch (error) {
      handleApiError(error, "tahmin yapma");
    } finally {
      setIsLoading(false);
    }
  };
  
  const seqLength = model.config?.model_params?.sequence_length || 'Bilinmiyor';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Anlık Tahmin</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </header>
        <div className={styles.body}>
          <p>
            <b>{model.pipeline_name}</b> modeli ile tahmin yapmak için, modelin eğitildiği formatta ve en az 
            <b> {seqLength} </b> 
            adet geçmiş veriyi içeren bir JSON dizisi girin.
          </p>
          <textarea
            className={styles.inputArea}
            placeholder='[{"Close": 150.0, ...}, {"Close": 151.2, ...}]'
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            disabled={isLoading}
          />

          {isLoading && <p style={{textAlign: 'center'}}>Tahmin yapılıyor...</p>}

          {predictionResult && (
            <div className={styles.result}>
              <p>Modelin Tahmini Değeri</p>
              <div className={styles.predictionValue}>
                {safeToFixed(predictionResult.prediction, 4)}
              </div>
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <button className="button-secondary" onClick={onClose}>İptal</button>
          <button className="button-primary" onClick={handlePredict} disabled={isLoading}>
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

export default PredictionModal;