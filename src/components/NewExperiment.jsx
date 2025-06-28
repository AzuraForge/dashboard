// ========== DOSYA: dashboard/src/components/NewExperiment.jsx ==========
import { useState } from 'react';
import { startNewExperiment } from '../services/api';

function NewExperiment({ onExperimentStarted }) {
  const [pipeline, setPipeline] = useState('stock_predictor');
  const [epochs, setEpochs] = useState(10);
  const [ticker, setTicker] = useState('AAPL');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    
    const config = {
      pipeline_name: pipeline,
      data_sourcing: { ticker: ticker },
      training_params: { epochs: parseInt(epochs, 10) }
    };
    
    try {
      const response = await startNewExperiment(config);
      setFeedback({ type: 'success', message: `Görev başarıyla gönderildi! ID: ${response.data.task_id}` });
      setTimeout(onExperimentStarted, 2000); // 2 sn sonra listeye dön
    } catch (err) {
      setFeedback({ type: 'error', message: 'Deney başlatılamadı.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Yeni Deney Parametreleri</h2>
      <div className="form-group">
        <label htmlFor="pipeline">Pipeline</label>
        <select id="pipeline" value={pipeline} onChange={(e) => setPipeline(e.target.value)}>
          <option value="stock_predictor">stock_predictor</option>
          {/* Diğer pipeline'lar buraya eklenebilir */}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="ticker">Hisse Senedi Kodu (Ticker)</label>
        <input id="ticker" type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
      </div>
      <div className="form-group">
        <label htmlFor="epochs">Epoch Sayısı</label>
        <input id="epochs" type="number" value={epochs} onChange={(e) => setEpochs(e.target.value)} />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Başlatılıyor...' : 'Eğitimi Başlat'}
      </button>
      {feedback && <p className={`feedback ${feedback.type}`}>{feedback.message}</p>}
    </form>
  );
}

export default NewExperiment;