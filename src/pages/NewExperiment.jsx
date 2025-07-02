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
    return value.map(v => typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v).filter(v => !isNaN(v)); 
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
    }).filter(v => !isNaN(v));
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

// --- Katlanabilir Alan Render Fonksiyonu ---
const renderFieldset = (sectionName, legendText, content, expandedSections, toggleSection) => (
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


// --- Pipeline'a Özel Form Bileşenleri ---

function StockPredictorConfigForm({ config, onConfigChange, errors }) {
  const localConfig = JSON.parse(JSON.stringify(config || {}));
  
  const [expandedSections, setExpandedSections] = useState({
    data_sourcing: true, feature_engineering: false, model_params: false,
    training_params: false, system: false,
  });

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
  
  const renderSharedFieldset = (sectionName, legendText, content) => renderFieldset(sectionName, legendText, content, expandedSections, toggleSection);

  return (
    <>
      {renderSharedFieldset('data_sourcing', 'Veri Kaynağı', (
        <div className="form-group">
          <label htmlFor="ticker">Ticker Sembolü:</label>
          <input
            type="text" id="ticker"
            value={formatListInput(localConfig.data_sourcing?.ticker)}
            onChange={(e) => handleChange(e, 'data_sourcing.ticker')}
            className={errors['data_sourcing.ticker'] ? 'input-error' : ''}
            placeholder="Örn: MSFT, AAPL, GOOG"
          />
          <small>Tek bir değer veya virgülle ayrılmış birden fazla değer.</small>
          {errors['data_sourcing.ticker'] && <span className="form-error-message">{errors['data_sourcing.ticker']}</span>}
        </div>
      ))}
      {renderSharedFieldset('feature_engineering', 'Özellik Mühendisliği', (
        <div className="form-group">
          <label htmlFor="target_col_transform">Hedef Sütun Dönüşümü:</label>
          <select id="target_col_transform" value={localConfig.feature_engineering?.target_col_transform || 'none'} onChange={(e) => handleChange(e, 'feature_engineering.target_col_transform')}>
            <option value="none">Yok</option>
            <option value="log">Log (log1p)</option>
          </select>
        </div>
      ))}
      {renderSharedFieldset('model_params', 'Model Parametreleri', (
        <>
          <div className="form-group"><label htmlFor="sequence_length">Sekans Uzunluğu:</label><input type="text" id="sequence_length" value={formatListInput(localConfig.model_params?.sequence_length)} onChange={(e) => handleChange(e, 'model_params.sequence_length')} /></div>
          <div className="form-group"><label htmlFor="hidden_size">Gizli Katman Boyutu:</label><input type="text" id="hidden_size" value={formatListInput(localConfig.model_params?.hidden_size)} onChange={(e) => handleChange(e, 'model_params.hidden_size')} /></div>
        </>
      ))}
      {renderSharedFieldset('training_params', 'Eğitim Parametreleri', (
        <>
          <div className="form-group"><label htmlFor="epochs">Epoch Sayısı:</label><input type="text" id="epochs" value={formatListInput(localConfig.training_params?.epochs)} onChange={(e) => handleChange(e, 'training_params.epochs')} /></div>
          <div className="form-group"><label htmlFor="lr">Öğrenme Oranı (LR):</label><input type="text" id="lr" value={formatListInput(localConfig.training_params?.lr)} onChange={(e) => handleChange(e, 'training_params.lr')} /></div>
          <div className="form-group"><label htmlFor="optimizer">Optimizer:</label><select id="optimizer" value={localConfig.training_params?.optimizer || 'adam'} onChange={(e) => handleChange(e, 'training_params.optimizer')}><option value="adam">Adam</option><option value="sgd">SGD</option></select></div>
          <div className="form-group"><label htmlFor="test_size">Test Seti Boyutu:</label><input type="text" id="test_size" value={formatListInput(localConfig.training_params?.test_size)} onChange={(e) => handleChange(e, 'training_params.test_size')} /></div>
          <div className="form-group"><label htmlFor="validate_every">Doğrulama Sıklığı (Epoch):</label><input type="text" id="validate_every" value={formatListInput(localConfig.training_params?.validate_every)} onChange={(e) => handleChange(e, 'training_params.validate_every')} /></div>
        </>
      ))}
      {renderSharedFieldset('system', 'Sistem Ayarları', (
        <>
          <div className="form-group"><label htmlFor="caching_enabled">Önbellek Etkin mi?</label><select id="caching_enabled" value={localConfig.system?.caching_enabled ? 'true' : 'false'} onChange={(e) => handleChange(e, 'system.caching_enabled')}><option value="true">Evet</option><option value="false">Hayır</option></select></div>
          <div className="form-group"><label htmlFor="cache_max_age_hours">Önbellek Yaşam Süresi (saat):</label><input type="text" id="cache_max_age_hours" value={formatListInput(localConfig.system?.cache_max_age_hours)} onChange={(e) => handleChange(e, 'system.cache_max_age_hours')} /></div>
        </>
      ))}
    </>
  );
}
StockPredictorConfigForm.propTypes = { config: PropTypes.object, onConfigChange: PropTypes.func.isRequired, errors: PropTypes.object.isRequired };


// --- YENİ EKLENEN FORM BİLEŞENİ ---
function WeatherForecasterConfigForm({ config, onConfigChange, errors }) {
  const localConfig = JSON.parse(JSON.stringify(config || {}));

  const [expandedSections, setExpandedSections] = useState({
    data_sourcing: true, feature_engineering: false, model_params: false,
    training_params: false, system: false,
  });

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
  
  const renderSharedFieldset = (sectionName, legendText, content) => renderFieldset(sectionName, legendText, content, expandedSections, toggleSection);

  return (
    <>
      {renderSharedFieldset('data_sourcing', 'Veri Kaynağı (Open-Meteo)', (
        <>
          <div className="form-group"><label htmlFor="latitude">Enlem (Latitude):</label><input type="text" id="latitude" value={formatListInput(localConfig.data_sourcing?.latitude)} onChange={(e) => handleChange(e, 'data_sourcing.latitude')} className={errors['data_sourcing.latitude'] ? 'input-error' : ''} /><small>Birden fazla değer virgülle ayrılabilir.</small>{errors['data_sourcing.latitude'] && <span className="form-error-message">{errors['data_sourcing.latitude']}</span>}</div>
          <div className="form-group"><label htmlFor="longitude">Boylam (Longitude):</label><input type="text" id="longitude" value={formatListInput(localConfig.data_sourcing?.longitude)} onChange={(e) => handleChange(e, 'data_sourcing.longitude')} className={errors['data_sourcing.longitude'] ? 'input-error' : ''} /><small>Birden fazla değer virgülle ayrılabilir.</small>{errors['data_sourcing.longitude'] && <span className="form-error-message">{errors['data_sourcing.longitude']}</span>}</div>
          <div className="form-group"><label htmlFor="hourly_vars">Saatlik Değişkenler:</label><input type="text" id="hourly_vars" value={formatListInput(localConfig.data_sourcing?.hourly_vars)} disabled /><small>Kullanılacak hava durumu özellikleri (şimdilik sabit).</small></div>
        </>
      ))}
      {renderSharedFieldset('feature_engineering', 'Özellik Mühendisliği', (
        <div className="form-group">
          <label htmlFor="target_col">Hedef Değişken:</label>
          <select id="target_col" value={localConfig.feature_engineering?.target_col || 'temperature_2m'} onChange={(e) => handleChange(e, 'feature_engineering.target_col')}>
            <option value="temperature_2m">Sıcaklık (2m)</option>
            <option value="relative_humidity_2m">Bağıl Nem (2m)</option>
            <option value="precipitation">Yağış</option>
            <option value="cloud_cover">Bulut Örtüsü</option>
          </select>
        </div>
      ))}
      {renderSharedFieldset('model_params', 'Model Parametreleri', (
        <>
          <div className="form-group"><label htmlFor="sequence_length">Sekans Uzunluğu (Saat):</label><input type="text" id="sequence_length" value={formatListInput(localConfig.model_params?.sequence_length)} onChange={(e) => handleChange(e, 'model_params.sequence_length')} /><small>Geçmiş kaç saatlik veri kullanılacak.</small></div>
          <div className="form-group"><label htmlFor="hidden_size">Gizli Katman Boyutu:</label><input type="text" id="hidden_size" value={formatListInput(localConfig.model_params?.hidden_size)} onChange={(e) => handleChange(e, 'model_params.hidden_size')} /></div>
        </>
      ))}
      {renderSharedFieldset('training_params', 'Eğitim Parametreleri', (
        <>
          <div className="form-group"><label htmlFor="epochs">Epoch Sayısı:</label><input type="text" id="epochs" value={formatListInput(localConfig.training_params?.epochs)} onChange={(e) => handleChange(e, 'training_params.epochs')} /></div>
          <div className="form-group"><label htmlFor="lr">Öğrenme Oranı (LR):</label><input type="text" id="lr" value={formatListInput(localConfig.training_params?.lr)} onChange={(e) => handleChange(e, 'training_params.lr')} /></div>
          <div className="form-group"><label htmlFor="test_size">Test Seti Boyutu:</label><input type="text" id="test_size" value={formatListInput(localConfig.training_params?.test_size)} onChange={(e) => handleChange(e, 'training_params.test_size')} /></div>
          <div className="form-group"><label htmlFor="validate_every">Doğrulama Sıklığı (Epoch):</label><input type="text" id="validate_every" value={formatListInput(localConfig.training_params?.validate_every)} onChange={(e) => handleChange(e, 'training_params.validate_every')} /></div>
        </>
      ))}
      {renderSharedFieldset('system', 'Sistem Ayarları', (
        <div className="form-group"><label htmlFor="cache_max_age_hours">Önbellek Yaşam Süresi (saat):</label><input type="text" id="cache_max_age_hours" value={formatListInput(localConfig.system?.cache_max_age_hours)} onChange={(e) => handleChange(e, 'system.cache_max_age_hours')} /></div>
      ))}
    </>
  );
}
WeatherForecasterConfigForm.propTypes = { config: PropTypes.object, onConfigChange: PropTypes.func.isRequired, errors: PropTypes.object.isRequired };


// --- Ana NewExperiment Bileşeni (Formu ve Butonları Yöneten Dış Bileşen) ---

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
  }, []); 

  useEffect(() => {
    const loadPipelineConfig = async (pipelineId) => {
      if (!pipelineId) {
        setCurrentConfig(null);
        setDefaultConfig(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setFormErrors({});
      try {
        const { data } = await fetchPipelineDefaultConfig(pipelineId);
        setCurrentConfig(data);
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

  const handleResetToDefault = useCallback(() => {
    if (defaultConfig) {
      setCurrentConfig(JSON.parse(JSON.stringify(defaultConfig)));
      setFormErrors({});
      toast.info('Konfigürasyon varsayılan ayarlara sıfırlandı.');
    }
  }, [defaultConfig]);

  const validateConfig = (config) => {
    // Gelecekteki geliştirmeler için yer tutucu
    return {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentConfig) {
        toast.error('Konfigürasyon henüz yüklenmedi.');
        return;
    }

    let configToSendToApi = JSON.parse(JSON.stringify(currentConfig));
    
    // UI'daki string listelerini sayısal listelere/değerlere dönüştür
    const processNode = (node) => {
        for (const key in node) {
            if (typeof node[key] === 'object' && node[key] !== null && !Array.isArray(node[key])) {
                processNode(node[key]);
            } else if (typeof node[key] === 'string' && key !== 'ticker' && key !== 'optimizer') {
                // Ticker gibi string olması gerekenleri hariç tut
                const numbers = parseNumberListInput(node[key]);
                if (numbers.length > 0) { // Sadece en az bir geçerli sayı varsa dönüştür
                    node[key] = numbers.length === 1 ? numbers[0] : numbers;
                }
            }
        }
    };
    processNode(configToSendToApi);
    
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
    }

    try {
      const { data } = await startNewExperiment(configToSendToApi); 
      if (data.batch_id) {
        toast.success(`🎉 Batch görevi (${data.task_ids.length} deney) başarıyla gönderildi!`);
      } else {
        toast.success(`🚀 Görev başarıyla gönderildi!`);
      }
      if (onExperimentStarted) onExperimentStarted(data.task_id);
    } catch (err) {
      toast.error('Deney başlatılamadı. API/Worker loglarını veya tarayıcı konsolunu kontrol edin.');
      console.error("Deney başlatma hatası:", err.response?.data?.detail || err.message || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedPipelineDetails = pipelines.find(p => p.id === selectedPipelineId);

  const renderSelectedPipelineForm = () => {
    if (isLoading) return <p>Parametreler yükleniyor...</p>;
    if (!currentConfig || Object.keys(currentConfig).length === 0) return <p>Bu pipeline için düzenlenebilir konfigürasyon bulunamadı.</p>;
    
    switch (selectedPipelineId) {
      case 'stock_predictor':
        return <StockPredictorConfigForm config={currentConfig} onConfigChange={setCurrentConfig} errors={formErrors} />;
      case 'weather_forecaster':
        return <WeatherForecasterConfigForm config={currentConfig} onConfigChange={setCurrentConfig} errors={formErrors} />;
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
              <input type="text" id="batch-name" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="Örn: LR ve Epoch Optimizasyonu" disabled={isLoading || isSubmitting} />
              <small>Birden fazla parametre kombinasyonu gönderirken grubu isimlendirmek için kullanılır.</small>
            </div>
          </div>
          
          <div className="card" style={{padding: 0, marginTop: '20px'}}> 
            <div onClick={handleResetToDefault} style={{borderBottom: '1px solid var(--border-color)', padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-color-darker)'}}>
                <span role="img" aria-label="reset">🔄</span> Varsayılan Konfigürasyona Dön
            </div>
            <div style={{padding: '15px'}}>
                <h3>Deney Parametreleri</h3>
                {renderSelectedPipelineForm()}
            </div>
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