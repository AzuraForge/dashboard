import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { toast } from 'react-toastify';

function PredictionModal({ model, onClose }) {
  const [inputValue, setInputValue] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // === DÜZELTME: Veri yolunu `model.results` olarak güncelliyoruz ===
  const featureCols = model.results?.feature_cols || [];
  const targetCol = model.results?.target_col || 'Bilinmiyor';
  const seqLength = model.config?.model_params?.sequence_length || 60;
  // === DÜZELTME SONU ===

  const handlePredict = async () => {
    setIsLoading(true);
    setPredictionResult(null);

    const values = String(inputValue || '').split(',').map(v => parseFloat(v.trim()));
    if (values.length < seqLength || values.some(isNaN)) {
      toast.error(`Lütfen en az ${seqLength} adet geçerli sayısal değeri virgülle ayırarak girin.`);
      setIsLoading(false);
      return;
    }

    try {
      const dataPayload = [];
      const relevantValues = values.slice(-seqLength);

      for (let i = 0; i < seqLength; i++) {
        const dataPoint = {};
        for (const col of featureCols) {
          dataPoint[col] = relevantValues[i];
        }
        dataPayload.push(dataPoint);
      }
      
      const response = await axios.post(`${API_BASE_URL}/${model.experiment_id}/predict`, {
        data: dataPayload,
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
          <p>
            <b>{model.pipeline_name}</b> modeli ile bir sonraki adımı tahmin etmek için, 
            <b> '{targetCol}' </b> için geçmiş
            <b> {seqLength} adet </b>
            veriyi virgülle ayırarak girin.
          </p>

          <div className={styles.formContainer}>
            <div className="form-group">
              <label htmlFor="predict-input">Geçmiş Veriler ({targetCol})</label>
              <textarea
                id="predict-input"
                className={styles.inputArea}
                placeholder={`Örn: 150.1, 151.2, 149.8, ... (en az ${seqLength} değer)`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>
          </div>

          {isLoading && <p style={{textAlign: 'center', color: 'var(--text-color-darker)'}}>Tahmin yapılıyor...</p>}

          {predictionResult && (
            <div className={styles.result}>
              <p>Modelin Bir Sonraki Adım İçin Tahmini ({targetCol})</p>
              <div className={styles.predictionValue}>
                {(predictionResult.prediction || 0).toFixed(4)}
              </div>
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <button className={styles.buttonSecondary} onClick={onClose} disabled={isLoading}>İptal</button>
          <button className="button-primary" onClick={handlePredict} disabled={isLoading || featureCols.length === 0}>
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