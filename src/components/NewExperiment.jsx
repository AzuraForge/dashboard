// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/NewExperiment.jsx ==========
import { useState, useEffect } from 'react';
import { startNewExperiment, fetchAvailablePipelines } from '../services/api';

const Feedback = ({ message, type }) => {
    if (!message) return null;
    return <p className={`feedback ${type}`}>{message}</p>;
};

function NewExperiment({ onExperimentStarted }) {
    const [pipelines, setPipelines] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const loadPipelines = async () => {
            try {
                const response = await fetchAvailablePipelines();
                setPipelines(response.data);
                if (response.data.length > 0) {
                    setSelectedPipeline(response.data[0]);
                }
            } catch (error) {
                setFeedback({ type: 'error', message: 'Pipeline listesi yüklenemedi.' });
            } finally {
                setIsLoading(false);
            }
        };
        loadPipelines();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPipeline) return;

        setIsLoading(true);
        setFeedback(null);
        
        try {
            // Sadece pipeline adını gönder, worker varsayılan config'i kullanacak
            const response = await startNewExperiment({ pipeline_name: selectedPipeline.id });
            const taskId = response.data.task_id;
            setFeedback({ type: 'success', message: `Görev gönderildi! ID: ${taskId}` });
            
            if (onExperimentStarted && taskId) {
                onExperimentStarted(taskId);
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Deney başlatılamadı.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && pipelines.length === 0) return <p>Pipeline'lar yükleniyor...</p>;
    if (pipelines.length === 0) return <p className="error">Kurulu pipeline eklentisi bulunamadı.</p>;

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h2>Yeni Deney Başlat</h2>
            <div className="form-group">
                <label htmlFor="pipeline">Pipeline Eklentisi</label>
                <select id="pipeline" value={selectedPipeline?.id || ''} onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedPipeline(pipelines.find(p => p.id === newId));
                }}>
                    {pipelines.map(p => ( <option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
            </div>
            {/* Şimdilik konfigürasyon formunu basitleştirelim */}
            <p>Seçilen Pipeline: <strong>{selectedPipeline?.name}</strong></p>
            <p>Açıklama: <i>{selectedPipeline?.description}</i></p>

            <button type="submit" disabled={isLoading} className="button-primary">
                {isLoading ? 'Başlatılıyor...' : `"${selectedPipeline?.name}" Eğitimini Başlat`}
            </button>
            <Feedback message={feedback?.message} type={feedback?.type} />
        </form>
    );
}

export default NewExperiment;