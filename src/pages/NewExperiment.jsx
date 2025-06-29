// Bu dosyanın içeriği de önceki cevaptaki ile aynı, tam halini tekrar veriyorum
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { startNewExperiment, fetchAvailablePipelines, fetchPipelineDefaultConfig } from '../services/api';

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
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (<div key={fieldId} className="form-group-section"><label><strong>{key.replace(/_/g, ' ')}</strong></label><div style={{ marginLeft: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '15px' }}>{traverseConfig(value, currentPath)}</div></div>);
    }
    const inputType = typeof value === 'number' ? 'number' : 'text';
    return (<div key={fieldId} className="form-group"><label htmlFor={fieldId}>{key.replace(/_/g, ' ')}:</label><input type={inputType} id={fieldId} value={value || ''} onChange={(e) => handleChange(e, currentPath)} step={inputType === 'number' ? 'any' : undefined}/></div>);
  });
  return traverseConfig(config);
};

function NewExperiment({ onExperimentStarted }) {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        const response = await fetchAvailablePipelines();
        setPipelines(response.data);
        if (response.data.length > 0) setSelectedPipelineId(response.data[0].id);
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
    setIsLoading(true);
    const configToSend = { ...currentConfig, pipeline_name: selectedPipelineId };
    try {
      const { data } = await startNewExperiment(configToSend);
      toast.success(`Görev başarıyla gönderildi! ID: ${data.task_id}`);
      if (onExperimentStarted) onExperimentStarted(data.task_id);
      navigate('/');
    } catch (err) {
      toast.error('Deney başlatılamadı. API/Worker loglarını kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPipelineDetails = pipelines.find(p => p.id === selectedPipelineId);

  if (isLoading && pipelines.length === 0) return <p>Pipeline'lar yükleniyor...</p>;

  return (
    <div className="new-experiment-page">
      <div className="page-header"><h1>Yeni Deney Başlat</h1><p>Mevcut bir AI pipeline'ı seçerek yeni bir eğitim süreci başlatın.</p></div>
      <form onSubmit={handleSubmit} className="form-container card">
        <div className="form-group"><label htmlFor="pipeline-select">Çalıştırılacak Pipeline Eklentisi</label><select id="pipeline-select" value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} disabled={isLoading}>{pipelines.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}</select></div>
        {selectedPipelineDetails && (<div className="pipeline-details" style={{padding: '15px', background: 'var(--bg-color)', borderRadius: '8px'}}><h3>{selectedPipelineDetails.name}</h3><p><i>{selectedPipelineDetails.description}</i></p></div>)}
        <div className="card" style={{ marginTop: '20px' }}><h3>Deney Parametreleri</h3>{isLoading ? <p>Yükleniyor...</p> : (currentConfig ? renderConfigForm(currentConfig, setCurrentConfig) : <p>Bu pipeline için düzenlenebilir konfigürasyon yok.</p>)}</div>
        <button type="submit" disabled={isLoading} className="button-primary" style={{marginTop: '20px'}}>Eğitimi Başlat</button>
      </form>
    </div>
  );
}
NewExperiment.propTypes = { onExperimentStarted: PropTypes.func.isRequired };
export default NewExperiment;