// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/NewExperiment.jsx (TAM VE NİHAİ HALİ) ==========
import { useState, useEffect } from 'react';
import { startNewExperiment, fetchAvailablePipelines } from '../services/api';

// Kullanıcıya daha iyi geri bildirim vermek için bir bileşen
const Feedback = ({ message, type }) => {
  if (!message) return null;
  return <p className={`feedback ${type}`}>{message}</p>;
};

function NewExperiment({ onExperimentStarted }) {
  // State tanımlamaları
  const [pipelines, setPipelines] = useState([]); // API'dan gelen tüm pipeline'lar
  const [selectedPipelineId, setSelectedPipelineId] = useState(''); // Seçili pipeline'ın ID'si
  const [selectedPipelineDetails, setSelectedPipelineDetails] = useState(null); // Seçili pipeline'ın tam detayları
  const [isLoading, setIsLoading] = useState(true); // Yüklenme durumu
  const [feedback, setFeedback] = useState(null); // Kullanıcı geri bildirimi

  // --- Pipeline listesini API'dan çek ---
  // Bileşen ilk yüklendiğinde, mevcut tüm pipeline'ları ve konfigürasyonlarını API'dan çek
  useEffect(() => {
    const loadPipelines = async () => {
      try {
        const response = await fetchAvailablePipelines();
        setPipelines(response.data);
        // Eğer pipeline varsa, ilkini varsayılan olarak seç
        if (response.data.length > 0) {
          const firstPipeline = response.data[0];
          setSelectedPipelineId(firstPipeline.id);
          setSelectedPipelineDetails(firstPipeline);
        }
      } catch (error) {
        setFeedback({ type: 'error', message: 'Pipeline listesi yüklenemedi. API\'nizin /api/v1/pipelines endpoint\'ini kontrol edin.' });
        console.error("Error fetching pipelines:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPipelines();
  }, []); // Boş dizi, bu etkinin sadece bir kez çalışmasını sağlar

  // --- Form Gönderimi ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPipelineId) {
      setFeedback({ type: 'error', message: 'Lütfen bir pipeline seçin.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    
    // Sadece pipeline_name'i gönderiyoruz. Diğer konfigürasyonlar Worker'daki varsayılanlardan alınacak.
    const configToSend = {
      pipeline_name: selectedPipelineId,
      // Dashboard'dan ek parametre göndermek istersek buraya ekleyeceğiz:
      // data_sourcing: { ticker: "MSFT" },
      // training_params: { epochs: 10 }
    };
    
    try {
      const response = await startNewExperiment(configToSend);
      const taskId = response.data.task_id;
      setFeedback({ type: 'success', message: `Görev başarıyla gönderildi! ID: ${taskId}` });
      
      // Görev başladıktan sonra canlı takip ekranına geç
      if (onExperimentStarted && taskId) {
        onExperimentStarted(taskId);
      }
      
    } catch (err) {
      setFeedback({ type: 'error', message: 'Deney başlatılamadı. API ve Worker loglarını kontrol edin.' });
      console.error("Error starting experiment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render (Görünüm) ---
  if (isLoading) return <p>Pipeline'lar yükleniyor...</p>;
  if (pipelines.length === 0) return <p className="error">Platforma kurulu ve keşfedilmiş pipeline eklentisi bulunamadı.</p>;

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Yeni Deney Başlat</h2>
      
      <div className="form-group">
        <label htmlFor="pipeline-select">Çalıştırılacak Pipeline Eklentisi</label>
        <select id="pipeline-select" value={selectedPipelineId} onChange={(e) => {
          const newId = e.target.value;
          setSelectedPipelineId(newId);
          setSelectedPipelineDetails(pipelines.find(p => p.id === newId));
        }}>
          {pipelines.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>
      
      {selectedPipelineDetails && (
        <div className="pipeline-details">
          <p><strong>Açıklama:</strong> <i>{selectedPipelineDetails.description}</i></p>
          <p><strong>Repo:</strong> <a href={selectedPipelineDetails.repository} target="_blank" rel="noopener noreferrer">{selectedPipelineDetails.repository}</a></p>
        </div>
      )}

      <p>Şimdilik, eğitim varsayılan parametrelerle başlatılacaktır.</p>

      <button type="submit" disabled={isLoading} className="button-primary">
        {isLoading ? 'Başlatılıyor...' : `"${selectedPipelineDetails?.name || 'Seçilen'}" Eğitimini Başlat`}
      </button>
      
      <Feedback message={feedback?.message} type={feedback?.type} />
    </form>
  );
}

// --- EKSİK OLAN SATIR ---
export default NewExperiment;