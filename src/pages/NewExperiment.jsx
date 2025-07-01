// dashboard/src/pages/NewExperiment.jsx
// Bu dosya artık bir React sayfası değil, sadece form içeriği sağlayan bir bileşen.

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { fetchAvailablePipelines, fetchPipelineDefaultConfig, startNewExperiment } from '../services/api';

// Helper: Aşağı ok ikonu (Katlanabilir bölümler için)
const ChevronDownIcon = ({ className = '' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
ChevronDownIcon.propTypes = { className: PropTypes.string };


// Yardımcı fonksiyon: Bir değeri (string, number, array) sayı dizisine dönüştürür.
const parseNumberListInput = (value) => {
  if (value === null || value === undefined || value === '') return []; 
  
  if (Array.isArray(value)) { 
    return value.map(v => typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v); 
  }
  
  if (typeof value === 'number') { 
    return [value]; 
  }

  if (typeof value === 'string') {
    const parts = value.split(',').map(s => s.trim()).filter(s => s !== '');
    return parts.map(s => {
      const decimalReadyString = s.replace(',', '.'); 
      const num = parseFloat(decimalReadyString);
      return isNaN(num) ? NaN : num; 
    });
  }
  
  return [NaN]; 
};

// Yardımcı fonksiyon: Input değerini string'e dönüştürür (UI'da görüntülemek için).
const formatListInput = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value?.toString() ?? ''; 
};


// --- Her Pipeline İçin Özel Form Bileşeni ---

function StockPredictorConfigForm({ config, onConfigChange, errors }) {
  const localConfig = JSON.parse(JSON.stringify(config || {}));
  
  const [expandedSections, setExpandedSections] = useState({
    data_sourcing: true, 
    feature_engineering: false, 
    model_params: false,
    training_params: false,
    system: false,
  });

  useEffect(() => {
    setExpandedSections(prev => ({ ...prev, data_sourcing: true }));
  }, [config]);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const handleChange = (e, path) => {
    const { value, type } = e.target;
    let newValue = value;

    if (type === 'select-one' && (value === 'true' || value === 'false')) {
        newValue = (value === 'true');
    }

    let updatedConfig = JSON.parse(JSON.stringify(localConfig));
    let current = updatedConfig;
    const pathParts = path.split('.'); 

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]] = current[pathParts[i]] || {};
    }
    current[pathParts[pathParts.length - 1]] = newValue; 
    onConfigChange(updatedConfig);
  };

  if (!config) return <p>Konfigürasyon yüklenemedi.</p>;

  const renderFieldset = (sectionName, legendText, content) => (
    <fieldset className={`form-fieldset collapsible-fieldset ${expandedSections[sectionName] ? 'expanded' : ''}`}>
      <div className={`collapsible-header ${!expandedSections[sectionName] ? 'collapsed' : ''}`} onClick={() => toggleSection(sectionName)}>
        <span>{legendText}</span>
        <ChevronDownIcon className="icon" />
      </div>
      <div className="collapsible-content">
        {content}
      </div>
    </fieldset>
  );


  return (
    <>
      {renderFieldset('data_sourcing', 'Veri Kaynağı', (
        <div className="form-group">
          <label htmlFor="ticker">Ticker Sembolü:</label>
          <input
            type="text"
            id="ticker"
            value={formatListInput(localConfig.data_sourcing?.ticker)}
            onChange={(e) => handleChange(e, 'data_sourcing.ticker')}
            className={errors['data_sourcing-ticker'] ? 'input-error' : ''}
            placeholder="Örn: MSFT, AAPL, GOOG"
          />
          <small>Tek bir değer veya virgülle ayrılmış birden fazla değer (örn: MSFT, AAPL, GOOG)</small>
          {errors['data_sourcing-ticker'] && <span className="form-error-message">{errors['data_sourcing-ticker']}</span>}
        </div>
      ))}

      {renderFieldset('feature_engineering', 'Özellik Mühendisliği', (
        <div className="form-group">
          <label htmlFor="target_col_transform">Hedef Sütun Dönüşümü:</label>
          <select
            id="target_col_transform"
            value={localConfig.feature_engineering?.target_col_transform || 'none'}
            onChange={(e) => handleChange(e, 'feature_engineering.target_col_transform')}
            className={errors['feature_engineering-target_col_transform'] ? 'input-error' : ''}
          >
            <option value="none">Yok</option>
            <option value="log">Log (log1p)</option>
          </select>
          <small>Modelin hedef sütunu üzerinde uygulanacak dönüşüm.</small>
          {errors['feature_engineering-target_col_transform'] && <span className="form-error-message">{errors['feature_engineering-target_col_transform']}</span>}
        </div>
      ))}

      {renderFieldset('model_params', 'Model Parametreleri', (
        <>
          <div className="form-group">
            <label htmlFor="sequence_length">Sekans Uzunluğu:</label>
            <input
              type="text" 
              id="sequence_length"
              value={formatListInput(localConfig.model_params?.sequence_length)}
              onChange={(e) => handleChange(e, 'model_params.sequence_length')}
              className={errors['model_params-sequence_length'] ? 'input-error' : ''}
              placeholder="Örn: 30, 60, 90"
            />
            <small>Geçmiş kaç günün verisinin girdi olarak kullanılacağı.</small>
            {errors['model_params-sequence_length'] && <span className="form-error-message">{errors['model_params-sequence_length']}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="hidden_size">Gizli Katman Boyutu:</label>
            <input
              type="text" 
              id="hidden_size"
              value={formatListInput(localConfig.model_params?.hidden_size)}
              onChange={(e) => handleChange(e, 'model_params.hidden_size')}
              className={errors['model_params-hidden_size'] ? 'input-error' : ''}
              placeholder="Örn: 50, 100, 150"
            />
            <small>LSTM katmanındaki gizli birim sayısı.</small>
            {errors['model_params-hidden_size'] && <span className="form-error-message">{errors['model_params-hidden_size']}</span>}
          </div>
        </>
      ))}

      {renderFieldset('training_params', 'Eğitim Parametreleri', (
        <>
          <div className="form-group">
            <label htmlFor="epochs">Epoch Sayısı:</label>
            <input
              type="text" 
              id="epochs"
              value={formatListInput(localConfig.training_params?.epochs)}
              onChange={(e) => handleChange(e, 'training_params.epochs')}
              className={errors['training_params-epochs'] ? 'input-error' : ''}
              placeholder="Örn: 50, 100"
            />
            <small>Modelin eğitim veri seti üzerinden kaç kez geçeceği.</small>
            {errors['training_params-epochs'] && <span className="form-error-message">{errors['training_params-epochs']}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="lr">Öğrenme Oranı (LR):</label>
            <input
              type="text" 
              id="lr"
              value={formatListInput(localConfig.training_params?.lr)}
              onChange={(e) => handleChange(e, 'training_params.lr')}
              className={errors['training_params-lr'] ? 'input-error' : ''}
              placeholder="Örn: 0.001, 0.0001"
            />
            <small>Optimizer'ın ağırlıkları ne kadar hızlı güncelleyeceği.</small>
            {errors['training_params-lr'] && <span className="form-error-message">{errors['training_params-lr']}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="optimizer">Optimizer:</label>
            <select
              id="optimizer"
              value={localConfig.training_params?.optimizer || 'adam'}
              onChange={(e) => handleChange(e, 'training_params.optimizer')}
              className={errors['training_params-optimizer'] ? 'input-error' : ''}
            >
              <option value="adam">Adam</option>
              <option value="sgd">SGD</option>
            </select>
            <small>Modelin ağırlıklarını güncellemek için kullanılan algoritma.</small>
            {errors['training_params-optimizer'] && <span className="form-error-message">{errors['training_params-optimizer']}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="test_size">Test Seti Boyutu (0.0 - 1.0):</label>
            <input
              type="text" 
              id="test_size"
              value={formatListInput(localConfig.training_params?.test_size)}
              onChange={(e) => handleChange(e, 'training_params.test_size')}
              className={errors['training_params-test_size'] ? 'input-error' : ''}
              placeholder="Örn: 0.1, 0.2"
            />
            <small>Veri setinin test için ayrılacak oranı.</small>
            {errors['training_params-test_size'] && <span className="form-error-message">{errors['training_params-test_size']}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="validate_every">Her Kaç Epoch'ta Bir Doğrula:</label>
            <input
              type="text" 
              id="validate_every"
              value={formatListInput(localConfig.training_params?.validate_every)}
              onChange={(e) => handleChange(e, 'training_params.validate_every')}
              className={errors['training_params-validate_every'] ? 'input-error' : ''}
              placeholder="Örn: 5, 10"
            />
            <small>Canlı takip panelindeki tahmin grafiğinin kaç epoch'ta bir güncelleneceği.</small>
            {errors['training_params-validate_every'] && <span className="form-error-message">{errors['training_params-validate_every']}</span>}
          </div>
        </>
      ))}
      
      {renderFieldset('system', 'Sistem Ayarları', (
        <>
          <div className="form-group">
            <label htmlFor="caching_enabled">Önbellek Etkin mi?</label>
            <select
              id="caching_enabled"
              value={localConfig.system?.caching_enabled ? 'true' : 'false'}
              onChange={(e) => handleChange(e, 'system.caching_enabled')} 
              className={errors['system-caching_enabled'] ? 'input-error' : ''}
            >
              <option value="true">Evet</option>
              <option value="false">Hayır</option>
            </select>
            <small>Veri çekme işleminin önbelleğe alınıp alınmayacağı.</small>
            {errors['system-caching_enabled'] && <span className="form-error-message">{errors['system-caching_enabled']}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="cache_max_age_hours">Önbellek Yaşam Süresi (saat):</label>
            <input
              type="text" 
              id="cache_max_age_hours"
              value={formatListInput(localConfig.system?.cache_max_age_hours)}
              onChange={(e) => handleChange(e, 'system.cache_max_age_hours')}
              className={errors['system-cache_max_age_hours'] ? 'input-error' : ''}
              placeholder="Örn: 12, 24"
            />
            <small>Önbellekteki verinin kaç saat sonra geçersiz sayılacağı.</small>
            {errors['system-cache_max_age_hours'] && <span className="form-error-message">{errors['system-cache_max_age_hours']}</span>}
          </div>
        </>
      ))}
    </>
  );
}

StockPredictorConfigForm.propTypes = {
  config: PropTypes.object,
  onConfigChange: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
};

// --- Ana NewExperiment Bileşeni (Formu ve Butonları Yöneten Dış Bileşen) ---
// Bu bileşen artık bir React sayfası değil, NewExperimentPanel içinde kullanılacak.

function NewExperiment({ onExperimentStarted, onClosePanel }) { 
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [defaultConfig, setDefaultConfig] = useState(null); 
  const [batchName, setBatchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const loadPipelines = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAvailablePipelines();
        if (response.data && response.data.length > 0) {
          setPipelines(response.data);
          if (!selectedPipelineId) {
            setSelectedPipelineId(response.data[0].id);
          }
        }
      } catch (error) { 
        toast.error('Pipeline listesi yüklenemedi. API servisinin çalıştığından emin olun.'); 
        console.error("Pipeline yükleme hatası:", error);
      } finally { setIsLoading(false); }
    };
    loadPipelines();
  }, [selectedPipelineId]); 

  useEffect(() => {
    const loadPipelineConfig = async (pipelineId) => {
      if (!pipelineId) {
        setCurrentConfig(null);
        setDefaultConfig(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setCurrentConfig(null); 
      setDefaultConfig(null);
      setFormErrors({});
      try {
        const { data } = await fetchPipelineDefaultConfig(pipelineId);
        const formattedData = formatConfigForUI(data); 
        setCurrentConfig(formattedData); 
        setDefaultConfig(JSON.parse(JSON.stringify(data))); 
      } catch (error) { 
        toast.error(`Konfigürasyon yüklenemedi: ${error.response?.data?.detail || error.message}`); 
        console.error("Konfigürasyon yükleme hatası:", error);
        setCurrentConfig({}); 
      } finally { 
        setIsLoading(false); 
      }
    };
    loadPipelineConfig(selectedPipelineId);
  }, [selectedPipelineId]);

  const formatConfigForUI = (config) => {
    const formatted = {};
    for (const key in config) {
        if (typeof config[key] === 'object' && config[key] !== null && !Array.isArray(config[key])) {
            formatted[key] = formatConfigForUI(config[key]); 
        } 
        else if (Array.isArray(config[key]) || typeof config[key] === 'number') {
            formatted[key] = formatListInput(config[key]); 
        }
        else {
            formatted[key] = config[key];
        }
    }
    return formatted;
  };

  const handleResetToDefault = useCallback(() => {
    if (defaultConfig) {
      setCurrentConfig(formatConfigForUI(defaultConfig));
      setFormErrors({});
      toast.info('Konfigürasyon varsayılan ayarlara sıfırlandı.');
    }
  }, [defaultConfig]);

  const validateConfig = (config) => {
    const errors = {};

    const validateNumberField = (value, path, min = -Infinity, max = Infinity) => {
      const parsedValues = parseNumberListInput(value); 
      
      if (parsedValues.length === 0) {
          errors[path.join('-')] = 'Bu alan boş bırakılamaz.';
          return;
      }
      if (parsedValues.some(v => typeof v !== 'number' || isNaN(v) || v < min || v > max)) {
          errors[path.join('-')] = `${path[path.length - 1]} için tüm değerler sayısal olmalı ve ${min} ile ${max} arasında olmalıdır.`;
      }
    };

    const validateStringField = (value, path) => {
        if (Array.isArray(value)) { 
            if (value.length === 0 || value.some(v => typeof v !== 'string' || v.trim() === '')) {
                errors[path.join('-')] = `${path[path.length - 1]} boş bırakılamaz veya boş öğe içeremez.`;
            }
        } else if (typeof value !== 'string' || value.trim() === '') { 
            errors[path.join('-')] = `${path[path.length - 1]} boş bırakılamaz.`;
        }
    };

    if (config.data_sourcing) {
        validateStringField(config.data_sourcing.ticker, ['data_sourcing', 'ticker']);
    }

    if (config.feature_engineering) {
        if (typeof config.feature_engineering.target_col_transform !== 'string' || !['none', 'log'].includes(config.feature_engineering.target_col_transform.toLowerCase())) {
            errors['feature_engineering-target_col_transform'] = 'Geçersiz dönüşüm seçimi.';
        }
    }

    if (config.model_params) {
      validateNumberField(config.model_params.sequence_length, ['model_params', 'sequence_length'], 1); 
      validateNumberField(config.model_params.hidden_size, ['model_params', 'hidden_size'], 1);     
    }

    if (config.training_params) {
      validateNumberField(config.training_params.epochs, ['training_params', 'epochs'], 1);         
      validateNumberField(config.training_params.lr, ['training_params', 'lr'], 0);                 
      validateNumberField(config.training_params.test_size, ['training_params', 'test_size'], 0, 1); 
      validateNumberField(config.training_params.validate_every, ['training_params', 'validate_every'], 1); 
      
      if (typeof config.training_params.optimizer !== 'string' || !['adam', 'sgd'].includes(config.training_params.optimizer.toLowerCase())) {
          errors['training_params-optimizer'] = 'Geçersiz optimizer seçimi.';
      }
    }

    if (config.system) {
        if (typeof config.system.caching_enabled !== 'boolean') { 
            errors['system-caching_enabled'] = 'Önbellek etkinleştirme seçimi yapılmalı.';
        }
        validateNumberField(config.system.cache_max_age_hours, ['system', 'cache_max_age_hours'], 0); 
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentConfig) {
        toast.error('Konfigürasyon henüz yüklenmedi.');
        return;
    }

    const configToSendToApi = JSON.parse(JSON.stringify(currentConfig));
    
    const numericFieldsPaths = [
        ['model_params', 'sequence_length'],
        ['model_params', 'hidden_size'],
        ['training_params', 'epochs'],
        ['training_params', 'lr'],
        ['training_params', 'test_size'],
        ['training_params', 'validate_every'],
        ['system', 'cache_max_age_hours']
    ];

    numericFieldsPaths.forEach(path => {
        let current = configToSendToApi;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
            if (current === undefined || current === null) return; 
        }
        const fieldName = path[path.length - 1];
        
        if (current && current[fieldName] !== undefined && current[fieldName] !== null) {
            const parsed = parseNumberListInput(current[fieldName]);
            if (parsed.length === 1 && !isNaN(parsed[0])) {
                current[fieldName] = parsed[0];
            } else {
                current[fieldName] = parsed; 
            }
        }
    });

    if (configToSendToApi.data_sourcing?.ticker && Array.isArray(configToSendToApi.data_sourcing.ticker) && configToSendToApi.data_sourcing.ticker.length === 1) {
        configToSendToApi.data_sourcing.ticker = configToSendToApi.data_sourcing.ticker[0];
    }
    
    const errors = validateConfig(configToSendToApi); 
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors); 
      toast.error('Lütfen formdaki hataları düzeltin.');
      return;
    }
    setFormErrors({}); 

    setIsSubmitting(true);
    configToSendToApi.pipeline_name = selectedPipelineId;

    if (batchName.trim()) { 
      configToSendToApi.batch_name = batchName.trim();
    } else {
        delete configToSendToApi.batch_name;
    }

    try {
      const { data } = await startNewExperiment(configToSendToApi); 
      if (data.batch_id) {
        toast.success(`🎉 Batch görevi (${data.task_ids.length} deney) başarıyla gönderildi! Batch ID: ${data.batch_id.slice(0, 8)}...`);
      } else {
        toast.success(`🚀 Görev başarıyla gönderildi! Deney ID: ${data.task_id.slice(0, 8)}...`);
      }
      if (onExperimentStarted) onExperimentStarted(data.task_id); // Paneli kapatıp ana sayfaya yönlendirir
    } catch (err) {
      toast.error('Deney başlatılamadı. API/Worker loglarını veya tarayıcı konsolunu kontrol edin.');
      console.error("Deney başlatma hatası:", err.response?.data?.detail || err.message || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedPipelineDetails = pipelines.find(p => p.id === selectedPipelineId);

  const renderSelectedPipelineForm = () => {
    if (isLoading) {
        return <p>Parametreler yükleniyor...</p>;
    }
    if (!currentConfig) { 
        return <p>Bu pipeline için düzenlenebilir konfigürasyon bulunamadı.</p>;
    }
    
    switch (selectedPipelineId) {
      case 'stock_predictor':
        return <StockPredictorConfigForm config={currentConfig} onConfigChange={setCurrentConfig} errors={formErrors} />;
      default:
        return <p>Lütfen bir pipeline seçin veya bu pipeline için yapılandırma formu bulunamadı.</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="new-experiment-panel-form"> 
        <div className="new-experiment-panel-form-content"> 
          <div className="card">
            <div className="form-group">
              <label htmlFor="pipeline-select">Çalıştırılacak Pipeline Eklentisi</label>
              <select id="pipeline-select" value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} disabled={isLoading || isSubmitting}>
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="batch-name">Deney Grubu Adı (İsteğe Bağlı)</label>
              <input 
                type="text" 
                id="batch-name" 
                value={batchName} 
                onChange={(e) => setBatchName(e.target.value)} 
                placeholder="Örn: LR ve Epoch Optimizasyonu"
                disabled={isLoading || isSubmitting}
              />
              <small style={{ color: 'var(--text-color-darker)', fontSize: '0.85em' }}>
                Birden fazla parametre kombinasyonu gönderirken grubu isimlendirmek için kullanılır.
              </small>
            </div>
          </div>
          
          <div className="card" style={{padding: 0}}> 
            <div className="collapsible-header" onClick={handleResetToDefault} style={{borderBottom: 'none', borderRadius: '8px', marginBottom: '15px', justifyContent: 'center'}}>
                <span role="img" aria-label="reset">🔄</span> Varsayılan Konfigürasyona Dön
            </div>
            <h3>Deney Parametreleri</h3>
            {renderSelectedPipelineForm()}
          </div>
        </div>

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
  );
}

NewExperiment.propTypes = { 
    onExperimentStarted: PropTypes.func.isRequired,
    onClosePanel: PropTypes.func.isRequired, 
};
export default NewExperiment;