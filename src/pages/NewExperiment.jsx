// dashboard/src/pages/NewExperiment.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { startNewExperiment, fetchAvailablePipelines, fetchPipelineDefaultConfig } from '../services/api';

// Yardımcı fonksiyon: Virgülle ayrılmış string'i sayı dizisine dönüştürür.
// Sayıya çevrilemezse NaN döndürür.
const parseNumberListInput = (value) => {
  if (!value) return [];
  const parts = value.split(',').map(s => s.trim()).filter(s => s !== '');
  return parts.map(s => {
    const num = parseFloat(s);
    return isNaN(num) ? NaN : num;
  });
};

// Yardımcı fonksiyon: Input değerini string'e dönüştürür.
const formatListInput = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
};


// --- Her Pipeline İçin Özel Form Bileşeni ---
// Şimdilik sadece Stock Predictor var. Gelecekte diğerleri de buraya eklenecek.

function StockPredictorConfigForm({ config, onConfigChange, errors }) {
  // Gelen config objesinin derin bir kopyasını oluşturarak doğrudan manipüle edelim
  const localConfig = JSON.parse(JSON.stringify(config || {}));

  const handleChange = (e, path, isNumber = false) => {
    const { value } = e.target;
    // value'yu doğrudan kullanmak yerine, parseNumberListInput ile işleyelim
    const parsedValue = isNumber ? parseNumberListInput(value) : value;

    // config objesini güncelle
    let updatedConfig = JSON.parse(JSON.stringify(localConfig));
    let current = updatedConfig;
    const pathParts = path.split('.'); // "training_params.epochs" -> ["training_params", "epochs"]

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]] = current[pathParts[i]] || {};
    }
    current[pathParts[pathParts.length - 1]] = parsedValue;
    onConfigChange(updatedConfig);
  };

  if (!config) return <p>Konfigürasyon yüklenemedi.</p>;

  return (
    <>
      <fieldset className="form-fieldset">
        <legend>Veri Kaynağı</legend>
        <div className="form-group">
          <label htmlFor="ticker">Ticker Sembolü:</label>
          <input
            type="text"
            id="ticker"
            value={formatListInput(localConfig.data_sourcing?.ticker)}
            onChange={(e) => handleChange(e, 'data_sourcing.ticker')}
            className={errors['data_sourcing-ticker'] ? 'input-error' : ''}
          />
          {errors['data_sourcing-ticker'] && <span className="form-error-message">{errors['data_sourcing-ticker']}</span>}
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Model Parametreleri</legend>
        <div className="form-group">
          <label htmlFor="sequence_length">Sekans Uzunluğu:</label>
          <input
            type="text" // Kullanıcı virgül girebilsin diye
            id="sequence_length"
            value={formatListInput(localConfig.model_params?.sequence_length)}
            onChange={(e) => handleChange(e, 'model_params.sequence_length', true)} // Sayı olarak parse et
            className={errors['model_params-sequence_length'] ? 'input-error' : ''}
          />
          {errors['model_params-sequence_length'] && <span className="form-error-message">{errors['model_params-sequence_length']}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="hidden_size">Gizli Katman Boyutu:</label>
          <input
            type="text" // Kullanıcı virgül girebilsin diye
            id="hidden_size"
            value={formatListInput(localConfig.model_params?.hidden_size)}
            onChange={(e) => handleChange(e, 'model_params.hidden_size', true)} // Sayı olarak parse et
            className={errors['model_params-hidden_size'] ? 'input-error' : ''}
          />
          {errors['model_params-hidden_size'] && <span className="form-error-message">{errors['model_params-hidden_size']}</span>}
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Eğitim Parametreleri</legend>
        <div className="form-group">
          <label htmlFor="epochs">Epoch Sayısı:</label>
          <input
            type="text" // Kullanıcı virgül girebilsin diye
            id="epochs"
            value={formatListInput(localConfig.training_params?.epochs)}
            onChange={(e) => handleChange(e, 'training_params.epochs', true)} // Sayı olarak parse et
            className={errors['training_params-epochs'] ? 'input-error' : ''}
          />
          <small>Virgülle ayırarak çoklu değer girebilirsiniz (örn: 10, 20, 30)</small>
          {errors['training_params-epochs'] && <span className="form-error-message">{errors['training_params-epochs']}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="lr">Öğrenme Oranı (LR):</label>
          <input
            type="text" // Kullanıcı virgül girebilsin diye
            id="lr"
            value={formatListInput(localConfig.training_params?.lr)}
            onChange={(e) => handleChange(e, 'training_params.lr', true)} // Sayı olarak parse et
            className={errors['training_params-lr'] ? 'input-error' : ''}
          />
          <small>Virgülle ayırarak çoklu değer girebilirsiniz (örn: 0.01, 0.001)</small>
          {errors['training_params-lr'] && <span className="form-error-message">{errors['training_params-lr']}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="optimizer">Optimizer:</label>
          <select
            id="optimizer"
            value={localConfig.training_params?.optimizer || 'adam'}
            onChange={(e) => handleChange(e, 'training_params.optimizer')}
          >
            <option value="adam">Adam</option>
            <option value="sgd">SGD</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="test_size">Test Seti Boyutu (0.0 - 1.0):</label>
          <input
            type="text" // float değerler için text kullanalım
            id="test_size"
            value={formatListInput(localConfig.training_params?.test_size)}
            onChange={(e) => handleChange(e, 'training_params.test_size', true)}
            className={errors['training_params-test_size'] ? 'input-error' : ''}
          />
          {errors['training_params-test_size'] && <span className="form-error-message">{errors['training_params-test_size']}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="validate_every">Her Kaç Epoch'ta Bir Doğrula:</label>
          <input
            type="text"
            id="validate_every"
            value={formatListInput(localConfig.training_params?.validate_every)}
            onChange={(e) => handleChange(e, 'training_params.validate_every', true)}
            className={errors['training_params-validate_every'] ? 'input-error' : ''}
          />
          {errors['training_params-validate_every'] && <span className="form-error-message">{errors['training_params-validate_every']}</span>}
        </div>
      </fieldset>
      
      <fieldset className="form-fieldset">
        <legend>Sistem Ayarları</legend>
        <div className="form-group">
          <label htmlFor="caching_enabled">Önbellek Etkin mi?</label>
          <select
            id="caching_enabled"
            value={localConfig.system?.caching_enabled ? 'true' : 'false'}
            onChange={(e) => handleChange(e, 'system.caching_enabled', e.target.value === 'true')}
          >
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="cache_max_age_hours">Önbellek Yaşam Süresi (saat):</label>
          <input
            type="text"
            id="cache_max_age_hours"
            value={formatListInput(localConfig.system?.cache_max_age_hours)}
            onChange={(e) => handleChange(e, 'system.cache_max_age_hours', true)}
            className={errors['system-cache_max_age_hours'] ? 'input-error' : ''}
          />
          {errors['system-cache_max_age_hours'] && <span className="form-error-message">{errors['system-cache_max_age_hours']}</span>}
        </div>
      </fieldset>
    </>
  );
}

StockPredictorConfigForm.propTypes = {
  config: PropTypes.object,
  onConfigChange: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
};

// --- Ana NewExperiment Bileşeni ---

function NewExperiment({ onExperimentStarted }) {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
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
      if (!pipelineId) {
        setCurrentConfig(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setCurrentConfig(null);
      setFormErrors({});
      try {
        const { data } = await fetchPipelineDefaultConfig(pipelineId);
        // API'den gelen config'i bir derin kopyayla set edelim
        setCurrentConfig(JSON.parse(JSON.stringify(data))); 
      } catch (error) { 
        toast.error(`Konfigürasyon yüklenemedi: ${error.message}`); 
        setCurrentConfig({}); // Hata durumunda boş bir obje ile başlat
      } finally { 
        setIsLoading(false); 
      }
    };
    loadPipelineConfig(selectedPipelineId);
  }, [selectedPipelineId]);

  // Yeni doğrulama mantığı
  const validateConfig = (config) => {
    const errors = {};
    const validateNumberField = (value, path) => {
      if (Array.isArray(value)) {
        if (value.some(v => typeof v !== 'number' || isNaN(v))) {
          errors[path.join('-')] = 'Liste içinde sadece sayısal değerler olmalıdır.';
        }
      } else if (typeof value !== 'number' || isNaN(value)) {
        errors[path.join('-')] = 'Sayısal bir değer olmalıdır.';
      } else if (path.includes('test_size') && (value < 0 || value > 1)) {
        errors[path.join('-')] = '0 ile 1 arasında bir değer olmalıdır.';
      } else if (path.includes('validate_every') && value <= 0) {
        errors[path.join('-')] = 'Sıfırdan büyük bir sayı olmalıdır.';
      }
    };

    if (config.data_sourcing?.ticker !== undefined && Array.isArray(config.data_sourcing.ticker)) {
        if (config.data_sourcing.ticker.some(t => typeof t !== 'string' || t.trim() === '')) {
            errors['data_sourcing-ticker'] = 'Ticker sembolleri boş olamaz.';
        }
    } else if (typeof config.data_sourcing?.ticker !== 'string' || config.data_sourcing.ticker.trim() === '') {
        errors['data_sourcing-ticker'] = 'Ticker sembolü boş olamaz.';
    }

    if (config.model_params) {
      validateNumberField(config.model_params.sequence_length, ['model_params', 'sequence_length']);
      validateNumberField(config.model_params.hidden_size, ['model_params', 'hidden_size']);
    }

    if (config.training_params) {
      validateNumberField(config.training_params.lr, ['training_params', 'lr']);
      validateNumberField(config.training_params.epochs, ['training_params', 'epochs']);
      validateNumberField(config.training_params.test_size, ['training_params', 'test_size']);
      validateNumberField(config.training_params.validate_every, ['training_params', 'validate_every']);
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentConfig) return;

    const errors = validateConfig(currentConfig);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Lütfen formdaki hataları düzeltin.');
      return;
    }
    setFormErrors({});

    setIsSubmitting(true);
    const configToSend = { ...currentConfig, pipeline_name: selectedPipelineId };
    if (batchName) {
      configToSend.batch_name = batchName;
    }

    try {
      const { data } = await startNewExperiment(configToSend);
      if (data.batch_id) {
        toast.success(`Batch görevi (${data.task_ids.length} deney) başarıyla gönderildi! Batch ID: ${data.batch_id}`);
        if (onExperimentStarted) onExperimentStarted(data.task_ids[0]);
      } else {
        toast.success(`Görev başarıyla gönderildi! ID: ${data.task_id}`);
        if (onExperimentStarted) onExperimentStarted(data.task_id);
      }
      navigate('/');
    } catch (err) {
      toast.error('Deney başlatılamadı. API/Worker loglarını kontrol edin.');
      console.error("Deney başlatma hatası:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedPipelineDetails = pipelines.find(p => p.id === selectedPipelineId);

  // Doğru Pipeline formunu seç
  const renderSelectedPipelineForm = () => {
    switch (selectedPipelineId) {
      case 'stock_predictor':
        return <StockPredictorConfigForm config={currentConfig} onConfigChange={setCurrentConfig} errors={formErrors} />;
      // Gelecekte diğer pipeline'lar buraya eklenecek (örn: case 'image_classifier': ...)
      default:
        return <p>Lütfen bir pipeline seçin veya bu pipeline için yapılandırma formu bulunamadı.</p>;
    }
  };

  return (
    <div className="new-experiment-layout">
      <div className="page-header">
        <h1>Yeni Deney Başlat</h1>
        <p>Mevcut bir AI pipeline'ı seçerek yeni bir eğitim süreci başlatın. Parametreleri virgülle ayırarak çoklu deney grupları oluşturabilirsiniz.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="new-experiment-form">
        <div className="form-main-content">
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
                Birden fazla parametre kombinasyonu gönderirken grubu isimlendirmek için.
              </small>
            </div>
          </div>
          
          <div className="card">
            <h3>Deney Parametreleri</h3>
            {isLoading ? <p>Parametreler yükleniyor...</p> : renderSelectedPipelineForm()}
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
    </div>
  );
}

NewExperiment.propTypes = { onExperimentStarted: PropTypes.func.isRequired };
export default NewExperiment;