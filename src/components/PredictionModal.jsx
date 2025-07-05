import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './PredictionModal.module.css';
import { toast } from 'react-toastify';

function PredictionModal({ model, onClose }) {
  const [inputData, setInputData] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modelin beklediği özellik sütunlarını al
  const featureCols = model.config?.results?.feature_cols || [];
  const seqLength = model.config?.model_params?.sequence_length || 'Bilinmiyor';

  // Form alanları için state'i başlat
  useEffect(() => {
    if (featureCols.length > 0) {
      const initialData = featureCols.reduce((acc, col) => {
        acc[col] = '';
        return acc;
      }, {});
      setInputData(initialData);
    }
  }, [featureCols]);

  const handleInputChange = (e, colName) => {
    setInputData(prev => ({ ...prev, [colName]: e.target.value }));
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setPredictionResult(null);

    try {
      // Girilen veriyi modelin beklediği formata dönüştür
      // Her özellik için `seqLength` kadar virgülle ayrılmış sayı bekliyoruz
      const dataPayload = [];
      for (let i = 0; i < seqLength; i++) {
        const dataPoint = {};
        for (const col of featureCols) {
          const values = String(inputData[col] || '').split(',').map(v => parseFloat(v.trim()));
          if (values.length < seqLength || isNaN(values[i])) {
            toast.error(`'${col}' için lütfen en az ${seqLength} adet geçerli sayı girin.`);
            setIsLoading(false);
            return;
          }
          dataPoint[col] = values[i];
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
            <b>{model.pipeline_name}</b> modeli ile tahmin yapmak için, modelin eğitildiği her özellik için
            <b> en az {seqLength} adet </b>
            geçmiş veriyi virgülle ayırarak girin.
          </p>

          <div className={styles.formContainer}>
            {featureCols.length > 0 ? (
              featureCols.map(col => (
                <div className="form-group" key={col}>
                  <label htmlFor={`predict-${col}`}>{col}</label>
                  <textarea
                    id={`predict-${col}`}
                    className={styles.inputArea}
                    placeholder={`Örn: 150.1, 151.2, 149.8, ... (${seqLength} adet)`}
                    value={inputData[col] || ''}
                    onChange={(e) => handleInputChange(e, col)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>
              ))
            ) : (
              <p>Bu model için özellik bilgisi bulunamadı.</p>
            )}
          </div>

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