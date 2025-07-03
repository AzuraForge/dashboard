import React, { useState, useEffect, useCallback } from 'react';
import { fetchExperiments } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import PredictionModal from '../components/PredictionModal';
import ModelCard from '../components/ModelCard';

function ModelRegistry() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);

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

  const handlePredictClick = (model) => {
    setSelectedModel(model);
  };

  return (
    <div className="model-registry">
      <div className="page-header">
        <h1>Model Kütüphanesi</h1>
        <p>Eğitilmiş ve üretime hazır modellerinizi yönetin ve anlık tahminler yapın.</p>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Modeller yükleniyor...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {models.length > 0 ? (
            models.map(model => (
              <ModelCard
                key={model.experiment_id}
                model={model}
                onPredictClick={handlePredictClick}
              />
            ))
          ) : (
            <div className="card" style={{textAlign: 'center'}}>
                <p>Henüz kaydedilmiş başarılı bir model bulunmuyor.</p>
                <p>Bir deneyi başarıyla tamamladığınızda, modeliniz burada listelenecektir.</p>
            </div>
          )}
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