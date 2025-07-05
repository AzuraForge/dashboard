import React from 'react';
import PropTypes from 'prop-types';
import styles from './ModelCard.module.css';

const safeToFixed = (value, digits) => (typeof value === 'number' && !isNaN(value)) ? value.toFixed(digits) : 'N/A';

function ModelCard({ model, onPredictClick }) {
  const {
    experiment_id,
    pipeline_name,
    config_summary,
    results_summary,
  } = model;

  return (
    <div className={`card ${styles.card}`}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>{pipeline_name}</h3>
          <span className={styles.id}>ID: {experiment_id}</span>
        </div>
        <span className="status-badge status-success">Başarılı</span>
      </header>

      <div className={styles.body}>
        <div className={styles.metrics}>
          <h4>Performans Metrikleri</h4>
          <div className={styles.metricItem}>
            <span>Final Kayıp</span>
            <span>{safeToFixed(results_summary?.final_loss, 6)}</span>
          </div>
          <div className={styles.metricItem}>
            <span>R² Skoru</span>
            <span>{safeToFixed(results_summary?.r2_score, 4)}</span>
          </div>
          <div className={styles.metricItem}>
            <span>Ortalama Hata (MAE)</span>
            <span>{safeToFixed(results_summary?.mae, 4)}</span>
          </div>
        </div>

        <div className={styles.config}>
          <h4>Temel Konfigürasyon</h4>
          <div className={styles.configItem}>
            <span>{config_summary?.ticker ? 'Sembol' : 'Konum'}</span>
            <span>{config_summary?.ticker || config_summary?.location || 'N/A'}</span>
          </div>
          <div className={styles.configItem}>
            <span>Epoch Sayısı</span>
            <span>{config_summary?.epochs || 'N/A'}</span>
          </div>
          <div className={styles.configItem}>
            <span>Öğrenme Oranı</span>
            <span>{config_summary?.lr || 'N/A'}</span>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <button className="button-primary" onClick={() => onPredictClick(model)}>
          <span role="img" aria-label="crystal-ball">🔮</span> Anlık Tahmin Yap
        </button>
      </footer>
    </div>
  );
}

ModelCard.propTypes = {
  model: PropTypes.object.isRequired,
  onPredictClick: PropTypes.func.isRequired,
};

export default ModelCard;