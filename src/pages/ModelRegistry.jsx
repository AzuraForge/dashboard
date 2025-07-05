import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchExperiments } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import PredictionModal from '../components/PredictionModal';
import styles from './ModelRegistry.module.css'; // Yeni CSS Modülü

// Helper ikonlar
const SortIcon = ({ direction }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '8px', verticalAlign: 'middle' }}>
    {direction === 'asc' && <path d="M12 4l-8 8h16z" />}
    {direction === 'desc' && <path d="M12 20l8-8H4z" />}
    {!direction && <><path d="M12 8l-4 4h8z" opacity="0.3" /><path d="M12 16l4-4H8z" opacity="0.3" /></>}
  </svg>
);

const safeToFixed = (value, digits) => (typeof value === 'number' && !isNaN(value)) ? value.toFixed(digits) : 'N/A';

function ModelRegistry() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'completed_at', direction: 'desc' });

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchExperiments();
      const successfulModels = data.filter(exp => exp.status === 'SUCCESS' && exp.model_path);
      setModels(successfulModels);
    } catch (error) {
      handleApiError(error, "modelleri yükleme");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const sortedModels = useMemo(() => {
    let sortableItems = [...models];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const getNestedValue = (obj, path) => path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
        
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [models, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderHeader = (label, key) => (
    <th onClick={() => requestSort(key)} className={styles.sortableHeader}>
      {label} <SortIcon direction={sortConfig.key === key ? sortConfig.direction : null} />
    </th>
  );
  
  if (loading) {
    return <p className={styles.stateMessage}>Modeller yükleniyor...</p>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className="page-header">
        <h1>Model Kütüphanesi</h1>
        <p>Eğitilmiş ve üretime hazır modellerinizi yönetin ve anlık tahminler yapın.</p>
      </div>
      
      {sortedModels.length > 0 ? (
        <div className={`table-container ${styles.tableContainer}`}>
          <table className={styles.modelTable}>
            <thead>
              <tr>
                {renderHeader('Pipeline', 'pipeline_name')}
                <th>Parametreler</th>
                {renderHeader('R² Skoru', 'results_summary.r2_score')}
                {renderHeader('MAE', 'results_summary.mae')}
                {renderHeader('Final Kayıp', 'results_summary.final_loss')}
                {renderHeader('Tamamlanma Tarihi', 'completed_at')}
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map(model => (
                <tr key={model.experiment_id}>
                  <td>
                    <div className={styles.pipelineCell}>
                      <strong>{model.pipeline_name}</strong>
                      <span className={styles.idText}>ID: {model.experiment_id}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.paramsCell}>
                      {Object.entries(model.config_summary).map(([key, value]) => (
                        <div key={key}><span>{key}:</span> {String(value)}</div>
                      ))}
                    </div>
                  </td>
                  <td className={`${styles.metricCell} ${sortConfig.key === 'results_summary.r2_score' ? styles.activeSortColumn : ''}`}>{safeToFixed(model.results_summary?.r2_score, 4)}</td>
                  <td className={`${styles.metricCell} ${sortConfig.key === 'results_summary.mae' ? styles.activeSortColumn : ''}`}>{safeToFixed(model.results_summary?.mae, 4)}</td>
                  <td className={`${styles.metricCell} ${sortConfig.key === 'results_summary.final_loss' ? styles.activeSortColumn : ''}`}>{safeToFixed(model.results_summary?.final_loss, 6)}</td>
                  <td>{new Date(model.completed_at).toLocaleString('tr-TR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <button className={styles.predictButton} onClick={() => setSelectedModel(model)}>
                      <span role="img" aria-label="crystal-ball">🔮</span> Tahmin Yap
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`card ${styles.emptyStateCard}`}>
          <span className={styles.emptyStateIcon}>📦</span>
          <h3>Kayıtlı Model Bulunamadı</h3>
          <p>Bir deneyi başarıyla tamamladığınızda, eğitilmiş modeliniz burada listelenecektir.</p>
        </div>
      )}
      
      {selectedModel && (
        <PredictionModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}

export default ModelRegistry;