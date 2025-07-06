import React, { useMemo, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Plot from 'react-plotly.js';
import { get, isObject } from 'lodash';
import { ThemeContext } from '../context/ThemeContext';
import styles from './ComparisonView.module.css'; // Mevcut modal stilini kullanabiliriz

function BatchComparisonModal({ experiments, title, onClose }) {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const { plotData, plotLayout } = useMemo(() => {
    if (!experiments || experiments.length < 1) return { plotData: [], plotLayout: {} };

    // Değişen hiperparametreleri ve metrikleri dinamik olarak bul
    const varyingParams = new Set();
    const baseConfig = experiments[0].config;

    // Sadece training_params ve model_params içindeki değişiklikleri ara
    const paramSections = ['training_params', 'model_params'];
    
    for (const exp of experiments.slice(1)) {
        for (const section of paramSections) {
            if (isObject(exp.config[section]) && isObject(baseConfig[section])) {
                for (const key in exp.config[section]) {
                    if (get(exp.config, `${section}.${key}`) !== get(baseConfig, `${section}.${key}`)) {
                        varyingParams.add(`${section}.${key}`);
                    }
                }
            }
        }
    }
    
    const dimensions = Array.from(varyingParams).map(path => ({
      label: path.split('.').pop(),
      values: experiments.map(exp => get(exp.config, path))
    }));

    // Performans metriklerini ekle
    const metrics = [
      { key: 'results.metrics.r2_score', label: 'R² Skoru' },
      { key: 'results.metrics.mae', label: 'MAE' },
      { key: 'results.final_loss', label: 'Final Kayıp' }
    ];

    metrics.forEach(metric => {
      const values = experiments.map(exp => get(exp, metric.key, null));
      if (values.some(v => typeof v === 'number')) {
        dimensions.push({ label: metric.label, values });
      }
    });

    // Renk skalası için final kayıp değerini kullan
    const colorValues = experiments.map(exp => exp.results.final_loss || 0);

    const data = [{
      type: 'parcoords',
      line: {
        color: colorValues,
        colorscale: 'Viridis',
        showscale: true,
        reversescale: true,
        cmin: Math.min(...colorValues),
        cmax: Math.max(...colorValues),
        colorbar: {
          title: 'Final Kayıp',
          titlefont: { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' },
          tickfont: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
        }
      },
      dimensions: dimensions,
    }];
    
    const layout = {
      title: 'Hiperparametre ve Metrik Analizi',
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
      },
      margin: { l: 80, r: 80, b: 50, t: 80, pad: 4 }
    };

    return { plotData: data, plotLayout: layout };
  }, [experiments, theme]);
  
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
        <header className={styles.header}>
          <h2>{title} ({experiments.length} adet)</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Kapat">×</button>
        </header>
        <div className={styles.body} style={{ display: 'grid', placeContent: 'stretch', padding: '10px' }}>
          {plotData.length > 0 && plotData[0].dimensions.length > 1 ? (
            <Plot
              data={plotData}
              layout={plotLayout}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              config={{ responsive: true }}
            />
          ) : <p style={{textAlign: 'center', padding: '2rem'}}>Analiz için yeterli değişen parametre veya metrik bulunamadı.</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}

BatchComparisonModal.propTypes = {
  experiments: PropTypes.array.isRequired,
  title: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default BatchComparisonModal;