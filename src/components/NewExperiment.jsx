// ========== DOSYA: dashboard/src/components/NewExperiment.jsx (TAM VE NİHAİ HALİ) ==========

import { useState, useEffect } from 'react';
import { startNewExperiment, fetchAvailablePipelines } from '../services/api';

// Kullanıcıya daha iyi geri bildirim vermek için bir bileşen
const Feedback = ({ message, type }) => {
  if (!message) return null;
  return <p className={`feedback ${type}`}>{message}</p>;
};

// Formu render etmek için bir bileşen
const ConfigForm = ({ config, onConfigChange }) => {
  if (!config) return null;

  // Konfigürasyonun temel bölümlerini dinamik olarak işle
  const handleInputChange = (section, key, value) => {
    // Gelen değerin tipini korumaya çalış (sayısal veya metin)
    const originalValue = config[section][key];
    const newValue = typeof originalValue === 'number' ? parseFloat(value) || 0 : value;
    onConfigChange(section, key, newValue);
  };

  return (
    <>
      {config.data_sourcing && (
        <div className="config-section">
          <h3>Veri Kaynağı</h3>
          <div className="form-group">
            <label htmlFor="ticker">Hisse Senedi Kodu (Ticker)</label>
            <input
              id="ticker"
              type="text"
              value={config.data_sourcing.ticker}
              onChange={(e) => handleInputChange('data_sourcing', 'ticker', e.target.value.toUpperCase())}
            />
          </div>
           <div className="form-group">
            <label htmlFor="start_date">Başlangıç Tarihi</label>
            <input
              id="start_date"
              type="text"
              value={config.data_sourcing.start_date}
              onChange={(e) => handleInputChange('data_sourcing', 'start_date', e.target.value)}
            />
          </div>
        </div>
      )}
      
      {config.training_params && (
        <div className="config-section">
          <h3>Eğitim Parametreleri</h3>
          <div className="form-group">
            <label htmlFor="epochs">Epoch Sayısı</label>
            <input
              id="epochs"
              type="number"
              value={config.training_params.epochs}
              onChange={(e) => handleInputChange('training_params', 'epochs', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="lr">Öğrenme Oranı (Learning Rate)</label>
            <input
              id="lr"
              type="number"
              step="0.001"
              value={config.training_params.lr}
              onChange={(e) => handleInputChange('training_params', 'lr', e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  );
};


function NewExperiment({ onExperimentStarted }) {
  // State tanımlamaları
  const [availablePipelines, setAvailablePipelines] = useState({});
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // --- Veri Çekme ---
  // Bileşen ilk yüklendiğinde, mevcut tüm pipeline'ları ve konfigürasyonlarını API'dan çek
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetchAvailablePipelines();
        const pipelinesData = response.data;
        setAvailablePipelines(pipelinesData);

        // API'dan veri geldiyse, ilk pipeline'ı varsayılan olarak seç
        const firstPipelineName = Object.keys(pipelinesData)[0];
        if (firstPipelineName) {
          setSelectedPipeline(firstPipelineName);
          setCurrentConfig(pipelinesData[firstPipelineName]);
        }
      } catch (error) {
        setFeedback({ type: 'error', message: 'Pipeline konfigürasyonları API\'dan yüklenemedi.' });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []); // Boş dizi, bu etkinin sadece bir kez çalışmasını sağlar

  // --- Olay Yöneticileri (Event Handlers) ---
  const handlePipelineChange = (e) => {
    const newPipelineName = e.target.value;
    setSelectedPipeline(newPipelineName);
    // Seçim değiştiğinde, state'deki konfigürasyonu güncelle
    setCurrentConfig(availablePipelines[newPipelineName]);
  };

  const handleConfigChange = (section, key, value) => {
    // Konfigürasyonun bir kopyasını oluşturarak state'i güncelle (Immutability)
    const newConfig = {
      ...currentConfig,
      [section]: {
        ...currentConfig[section],
        [key]: value,
      },
    };
    setCurrentConfig(newConfig);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    
    try {
      // API'a gönderilecek olan, state'deki güncel konfigürasyondur
      const response = await startNewExperiment(currentConfig);
      setFeedback({ type: 'success', message: `Görev başarıyla gönderildi! ID: ${response.data.task_id}` });
      setTimeout(onExperimentStarted, 2000); // 2 sn sonra liste sekmesine otomatik geç
    } catch (err) {
      setFeedback({ type: 'error', message: 'Deney başlatılamadı. API ve Worker loglarını kontrol edin.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render (Görünüm) ---
  if (isLoading && !currentConfig) {
    return <p>Pipeline'lar yükleniyor...</p>;
  }

  if (!selectedPipeline) {
    return <p className="error">Kurulu ve keşfedilmiş bir pipeline eklentisi bulunamadı.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Yeni Deney Başlat</h2>
      
      <div className="form-group">
        <label htmlFor="pipeline">Çalıştırılacak Pipeline Eklentisi</label>
        <select id="pipeline" value={selectedPipeline} onChange={handlePipelineChange}>
          {Object.keys(availablePipelines).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      
      <div className="config-grid">
        <ConfigForm config={currentConfig} onConfigChange={handleConfigChange} />
      </div>
      
      <button type="submit" disabled={isLoading} className="button-primary">
        {isLoading ? 'Başlatılıyor...' : 'Eğitimi Başlat'}
      </button>
      
      <Feedback message={feedback?.message} type={feedback?.type} />
    </form>
  );
}

export default NewExperiment;