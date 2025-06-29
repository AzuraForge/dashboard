import { useState, useEffect } from 'react';
import { startNewExperiment, fetchAvailablePipelines, fetchPipelineDefaultConfig } from '../services/api';
import PropTypes from 'prop-types';

const Feedback = ({ message, type }) => {
  if (!message) return null;
  return <p className={`feedback ${type}`}>{message}</p>;
};

Feedback.propTypes = {
  message: PropTypes.string,
  type: PropTypes.string.isRequired,
};

const renderConfigForm = (config, setConfig) => {
  if (!config) return null;

  const handleChange = (e, keyPath) => {
    const { value, type, checked } = e.target;
    const newConfig = JSON.parse(JSON.stringify(config)); // Derin kopyalama

    let current = newConfig;
    for (let i = 0; i < keyPath.length - 1; i++) {
      current = current[keyPath[i]] = current[keyPath[i]] || {}; // Yolu oluştur
    }
    current[keyPath[keyPath.length - 1]] = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value);
    setConfig(newConfig);
  };

  const traverseConfig = (obj, path = []) => {
    return Object.entries(obj).map(([key, value]) => {
      const currentPath = [...path, key];
      const fieldId = currentPath.join('-');

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={fieldId} className="form-group-section">
            <label><strong>{key.replace(/_/g, ' ').toUpperCase()}</strong></label> {/* Bölüm başlığı */}
            <div style={{ marginLeft: '20px', borderLeft: '2px solid #eee', paddingLeft: '15px' }}>
              {traverseConfig(value, currentPath)}
            </div>
          </div>
        );
      } else {
        // Basit form alanı
        const inputType = typeof value === 'number' ? 'number' : 'text';
        return (
          <div key={fieldId} className="form-group">
            <label htmlFor={fieldId}>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}:</label>
            <input
              type={inputType}
              id={fieldId}
              value={value || ''} // Null/undefined durumlarını handle et
              onChange={(e) => handleChange(e, currentPath)}
              step={inputType === 'number' ? 'any' : undefined}
            />
          </div>
        );
      }
    });
  };

  return traverseConfig(config);
};

function NewExperiment({ onExperimentStarted }) {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedPipelineDetails, setSelectedPipelineDetails] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false); // YENİ: Konfigürasyon yükleme durumu

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        const response = await fetchAvailablePipelines();
        setPipelines(response.data);
        if (response.data.length > 0) {
          const firstPipeline = response.data[0];
          setSelectedPipelineId(firstPipeline.id);
        }
      } catch (error) {
        setFeedback({ type: 'error', message: 'Pipeline listesi yüklenemedi.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadPipelines();
  }, []);

  const loadPipelineConfig = async (pipelineId) => {
    if (!pipelineId) return;
    setIsConfigLoading(true);
    setCurrentConfig(null);
    try {
      const configResponse = await fetchPipelineDefaultConfig(pipelineId);
      if (configResponse.data && !configResponse.data.error) {
        setCurrentConfig(configResponse.data);
        setFeedback(null);
      } else {
        setFeedback({ type: 'info', message: 'Bu pipeline için düzenlenebilir varsayılan konfigürasyon bulunamadı.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: `Konfigürasyon yüklenemedi: ${error.message}` });
    } finally {
        setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPipelineId) {
      setSelectedPipelineDetails(pipelines.find(p => p.id === selectedPipelineId));
      loadPipelineConfig(selectedPipelineId);
    }
  }, [selectedPipelineId, pipelines]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    
    // DÜZELTME: currentConfig null olsa bile pipeline_name'i gönder
    const configToSend = currentConfig ? { ...currentConfig, pipeline_name: selectedPipelineId } : { pipeline_name: selectedPipelineId };
    
    try {
      const response = await startNewExperiment(configToSend);
      const taskId = response.data.task_id;
      setFeedback({ type: 'success', message: `Görev başarıyla gönderildi! ID: ${taskId}` });
      if (onExperimentStarted) {
        onExperimentStarted(taskId);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Deney başlatılamadı. API ve Worker loglarını kontrol edin.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && pipelines.length === 0) return <p className="feedback info">Pipeline'lar yükleniyor...</p>;

  return (
    <form onSubmit={handleSubmit} className="form-container card">
      <div className="page-header">
        <h1><span role="img" aria-label="rocket">🚀</span> Yeni Deney Başlat</h1>
        <p>Platformda kurulu mevcut yapay zeka pipeline'larından birini seçerek yeni bir deney başlatın.</p>
      </div>

      <div className="form-group">
        <label htmlFor="pipeline-select">Çalıştırılacak Pipeline Eklentisi</label>
        <select id="pipeline-select" value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} disabled={isLoading}>
          {pipelines.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>
      
      {selectedPipelineDetails && (
        <div className="pipeline-details card">
          <h3>{selectedPipelineDetails.name} Detayları</h3>
          <p><strong>Açıklama:</strong> <i>{selectedPipelineDetails.description || 'Açıklama bulunmuyor.'}</i></p>
          <p><strong>Repository:</strong> <a href={selectedPipelineDetails.repository} target="_blank" rel="noopener noreferrer">{selectedPipelineDetails.repository}</a></p>
        </div>
      )}
      
      {isConfigLoading ? (
          <p className="feedback info">Konfigürasyon yükleniyor...</p>
      ) : currentConfig ? (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Deney Parametreleri (Düzenlenebilir)</h3>
          {renderConfigForm(currentConfig, setCurrentConfig)}
        </div>
      ) : (
        <p className="feedback info">Bu pipeline için düzenlenebilir varsayılan konfigürasyon bulunamadı. Deney, pipeline'ın kendi içindeki varsayılanlarıyla başlatılacaktır.</p>
      )}

      <button type="submit" disabled={isLoading || isConfigLoading} className="button-primary">
        {isLoading ? 'Başlatılıyor...' : `"${selectedPipelineDetails?.name || 'Seçilen'}" Eğitimini Başlat`}
      </button>
      
      <Feedback message={feedback?.message} type={feedback?.type} />
    </form>
  );
}

NewExperiment.propTypes = {
    onExperimentStarted: PropTypes.func.isRequired,
};
export default NewExperiment;