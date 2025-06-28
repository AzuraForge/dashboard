// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/NewExperiment.jsx ==========
import { useState, useEffect } from 'react';
import { startNewExperiment, fetchAvailablePipelines } from '../services/api';

const Feedback = ({ message, type }) => {
  if (!message) return null;
  return <p className={`feedback ${type}`}>{message}</p>;
};

function NewExperiment({ onExperimentStarted }) {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedPipelineDetails, setSelectedPipelineDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        const response = await fetchAvailablePipelines();
        setPipelines(response.data);
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPipelineId) {
      setFeedback({ type: 'error', message: 'Lütfen bir pipeline seçin.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    
    // --- KRİTİK DÜZELTME: Config nesnesini doğru oluştur ---
    // Worker'daki pipeline'ın beklediği tüm varsayılan konfigürasyonu burada oluşturuyoruz.
    const configToSend = {
      pipeline_name: selectedPipelineId,
      data_sourcing: { // pipeline.py'deki get fonksiyonu bunları kullanıyor
        ticker: "AAPL", 
        start_date: "2023-01-01" // Varsayılan tarih
      },
      training_params: { // pipeline.py'deki get fonksiyonu bunları kullanıyor
        epochs: 10,
        lr: 0.01
      }
    };
    
    try {
      const response = await startNewExperiment(configToSend);
      const taskId = response.data.task_id;
      setFeedback({ type: 'success', message: `Görev gönderildi! ID: ${taskId}` });
      
      if (onExperimentStarted && taskId) {
        onExperimentStarted(taskId);
      }
      
    } catch (err) {
      setFeedback({ type: 'error', message: 'Deney başlatılamadı.' });
      console.error("Error starting experiment:", err);
    } finally {
      setIsLoading(false);
    }
  };

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