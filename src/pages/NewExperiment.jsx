import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { startNewExperiment, fetchAvailablePipelines, fetchPipelineDefaultConfig } from '../services/api';

// Bu bileşen artık bu dosyanın içinde yerel olarak kalabilir.
const renderConfigForm = (config, setConfig) => {
  const handleChange = (e, keyPath) => {
    const { value, type } = e.target;
    const newConfig = JSON.parse(JSON.stringify(config));
    let current = newConfig;
    for (let i = 0; i < keyPath.length - 1; i++) {
      current = current[keyPath[i]] = current[keyPath[i]] || {};
    }
    current[keyPath[keyPath.length - 1]] = type === 'number' ? parseFloat(value) : value;
    setConfig(newConfig);
  };

  const traverseConfig = (obj, path = []) => Object.entries(obj).map(([key, value]) => {
    const currentPath = [...path, key];
    const fieldId = currentPath.join('-');
    const labelText = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <fieldset key={fieldId} className="form-fieldset">
          <legend>{labelText}</legend>
          {traverseConfig(value, currentPath)}
        </fieldset>
      );
    }
    const inputType = typeof value === 'number' ? 'number' : 'text';
    return (
      <div key={fieldId} className="form-group">
        <label htmlFor={fieldId}>{labelText}:</label>
        <input type={inputType} id={fieldId} value={value ?? ''} onChange={(e) => handleChange(e, currentPath)} step={inputType === 'number' ? 'any' : undefined} />
      </div>
    );
  });

  return traverseConfig(config);
};

function NewExperiment({ onExperimentStarted }) {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPipelines = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAvailablePipelines();
        if (response.data && response.data.length > 0) {
          setPipelines(response.data);
          setSelectedPipelineId(response.data[0].id);
        }
      } catch (error) { toast.error('Pipeline listesi yüklenemedi.'); } 
      finally { setIsLoading(false); }
    };
    loadPipelines();
  }, []);

  useEffect(() => {
    const loadPipelineConfig = async (pipelineId) => {
      if (!pipelineId) return;
      setIsLoading(true);
      setCurrentConfig(null);
      try {
        const { data } = await fetchPipelineDefaultConfig(pipelineId);
        if (data && !data.error) setCurrentConfig(data);
      } catch (error) { toast.error(`Konfigürasyon yüklenemedi: ${error.message}`); } 
      finally { setIsLoading(false); }
    };
    loadPipelineConfig(selectedPipelineId);
  }, [selectedPipelineId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const configToSend = { ...currentConfig, pipeline_name: selectedPipelineId };
    try {
      const { data } = await startNewExperiment(configToSend);
      toast.success(`Görev başarıyla gönderildi! ID: ${data.task_id}`);
      if (onExperimentStarted) onExperimentStarted(data.task_id);
      navigate('/');
    } catch (err) {
      toast.error('Deney başlatılamadı. API/Worker loglarını kontrol edin.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedPipelineDetails = pipelines.find(p => p.id === selectedPipelineId);

  return (
    // YENİ YAPI: Form, başlık ve aksiyon paneli olarak ayrıldı
    <div className="new-experiment-layout">
      <div className="page-header">
        <h1>Yeni Deney Başlat</h1>
        <p>Mevcut bir AI pipeline'ı seçerek yeni bir eğitim süreci başlatın.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="new-experiment-form">
        <div className="form-main-content"> {/* Kaydırılabilir alan */}
          <div className="card">
            <div className="form-group">
              <label htmlFor="pipeline-select">Çalıştırılacak Pipeline Eklentisi</label>
              <select id="pipeline-select" value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} disabled={isLoading || isSubmitting}>
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </div>
          </div>
          
          <div className="card">
            <h3>Deney Parametreleri</h3>
            {isLoading ? <p>Parametreler yükleniyor...</p> : (
              currentConfig ? renderConfigForm(currentConfig, setCurrentConfig) : <p>Bu pipeline için düzenlenebilir konfigürasyon bulunamadı.</p>
            )}
          </div>
        </div>

        {/* YENİ YAPI: Yapışkan Aksiyon Paneli */}
        <div className="form-action-bar">
          <div className="pipeline-info">
            <strong>Pipeline:</strong>
            <span>{selectedPipelineDetails?.name || '...'}</span>
          </div>
          <button type="submit" disabled={isLoading || isSubmitting} className="button-primary">
            {isSubmitting ? 'Başlatılıyor...' : 'Eğitimi Başlat'}
          </button>
        </div>
      </form>
    </div>
  );
}

NewExperiment.propTypes = { onExperimentStarted: PropTypes.func.isRequired };
export default NewExperiment;