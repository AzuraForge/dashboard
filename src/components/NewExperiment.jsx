// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/NewExperiment.jsx ==========
import { useState, useEffect } from 'react';
import { startNewExperiment, fetchAvailablePipelines } from '../services/api';

const Feedback = ({ message, type }) => {
    if (!message) return null;
    return <p className={`feedback ${type}`}>{message}</p>;
};

function NewExperiment({ onExperimentStarted }) {
    const [pipelines, setPipelines] = useState([]); // Artık bir dizi
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const loadPipelines = async () => {
            try {
                const response = await fetchAvailablePipelines();
                setPipelines(response.data); // Gelen diziyi state'e ata
                if (response.data.length > 0) {
                    const firstPipeline = response.data[0];
                    setSelectedPipelineId(firstPipeline.id);
                    // Varsayılan konfigürasyonu oluştur
                    setConfig({
                        pipeline_name: firstPipeline.id,
                        data_sourcing: { ticker: "AAPL", start_date: "2023-01-01" },
                        training_params: { epochs: 10, lr: 0.01 }
                    });
                }
            } catch (error) {
                setFeedback({ type: 'error', message: 'Pipeline listesi yüklenemedi.' });
            } finally {
                setIsLoading(false);
            }
        };
        loadPipelines();
    }, []);

    const handleConfigChange = (section, key, value) => {
        const newConfig = { ...config, [section]: { ...config[section], [key]: value } };
        setConfig(newConfig);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFeedback(null);
        try {
            const response = await startNewExperiment(config);
            setFeedback({ type: 'success', message: `Görev gönderildi! ID: ${response.data.task_id}` });
            setTimeout(onExperimentStarted, 2000);
        } catch (err) {
            setFeedback({ type: 'error', message: 'Deney başlatılamadı.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <p>Pipeline'lar yükleniyor...</p>;
    if (pipelines.length === 0) return <p className="error">Kurulu pipeline eklentisi bulunamadı.</p>;

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h2>Yeni Deney Başlat</h2>
            <div className="form-group">
                <label htmlFor="pipeline">Pipeline Eklentisi</label>
                <select id="pipeline" value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)}>
                    {pipelines.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            {config && (
                <div className="config-grid">
                    <div className="config-section">
                        <h3>Veri Kaynağı</h3>
                        <div className="form-group">
                            <label htmlFor="ticker">Hisse Senedi Kodu</label>
                            <input id="ticker" type="text" value={config.data_sourcing.ticker}
                                onChange={e => handleConfigChange('data_sourcing', 'ticker', e.target.value.toUpperCase())} />
                        </div>
                    </div>
                    <div className="config-section">
                        <h3>Eğitim Parametreleri</h3>
                        <div className="form-group">
                            <label htmlFor="epochs">Epoch Sayısı</label>
                            <input id="epochs" type="number" value={config.training_params.epochs}
                                onChange={e => handleConfigChange('training_params', 'epochs', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                </div>
            )}
            <button type="submit" disabled={isLoading} className="button-primary">
                {isLoading ? 'Başlatılıyor...' : 'Eğitimi Başlat'}
            </button>
            <Feedback message={feedback?.message} type={feedback?.type} />
        </form>
    );
}

export default NewExperiment;