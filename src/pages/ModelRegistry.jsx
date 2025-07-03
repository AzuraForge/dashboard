import React, { useState, useEffect, useCallback } from 'react';
import { fetchExperiments } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

// Bu bileşenleri bir sonraki adımda oluşturacağız.
// import PredictionModal from '../components/PredictionModal';
// import ModelCard from '../components/ModelCard';

function ModelRegistry() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [selectedModel, setSelectedModel] = useState(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchExperiments();
      // Sadece başarılı ve modeli kaydedilmiş (model_path'i olan) deneyleri filtrele
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

  return (
    <div className="model-registry">
      <div className="page-header">
        <h1>Model Kütüphanesi</h1>
        <p>Eğitilmiş ve üretime hazır modellerinizi yönetin ve anlık tahminler yapın.</p>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Modeller yükleniyor...</p>
      ) : (
        <div className="model-list-container">
          {models.length > 0 ? (
            models.map(model => (
              // Geçici olarak basit bir kart gösteriyoruz.
              // Bu kısım bir sonraki adımda ModelCard bileşeni ile değiştirilecek.
              <div key={model.experiment_id} className="card" style={{marginBottom: '1rem'}}>
                <h3 style={{marginTop: 0}}>{model.pipeline_name}</h3>
                <p style={{fontFamily: 'var(--font-mono)', fontSize: '0.8em', color: 'var(--text-color-darker)'}}>ID: {model.experiment_id}</p>
                <p><strong>Eğitim Bitiş:</strong> {new Date(model.completed_at).toLocaleString()}</p>
                <p><strong>Final Kayıp:</strong> {model.results_summary.final_loss?.toFixed(6) ?? 'N/A'}</p>
                <p><strong>R² Skoru:</strong> {model.results_summary.r2_score?.toFixed(4) ?? 'N/A'}</p>
                <button className='button-primary' disabled>Tahmin Yap (Yakında)</button>
              </div>
            ))
          ) : (
            <div className="card" style={{textAlign: 'center'}}>
                <p>Henüz kaydedilmiş başarılı bir model bulunmuyor.</p>
                <p>Bir deneyi başarıyla tamamladığınızda, modeliniz burada listelenecektir.</p>
            </div>
          )}
        </div>
      )}
      
      {/* 
      {selectedModel && (
        <PredictionModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )} 
      */}
    </div>
  );
}

export default ModelRegistry;