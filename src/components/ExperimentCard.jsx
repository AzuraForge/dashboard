// dashboard/src/components/ExperimentCard.jsx

import React, { useState, useEffect, useRef } from 'react'; 
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import SingleExperimentChart from './SingleExperimentChart'; 
import { getCssVar } from '../utils/cssUtils'; 
import { fetchExperimentDetails } from '../services/api'; 

const Icon = ({ path, className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d={path} /></svg>;
Icon.propTypes = { path: PropTypes.string.isRequired, className: PropTypes.string };

const ICONS = {
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  expand: "M19 19H5V5h14v14zm0-16H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" 
};

function ExperimentCard({ experiment, isSelected, onSelect }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); 
  // KRİTİK: fullDetails state'i sadece detay bölümü için kullanılacak.
  // Ana kart bilgileri ve rapor grafikleri 'experiment' prop'undan gelecek.
  const [fetchedFullDetails, setFetchedFullDetails] = useState(null); 
  const [detailsLoading, setDetailsLoading] = useState(false);

  // KRİTİK: experiment prop'undan tam config/results/error objelerini doğrudan alıyoruz.
  // API'den list_experiments() artık bunları döndürüyor.
  const { 
    experiment_id, status, task_id, pipeline_name,
    created_at, completed_at, failed_at,
    config, results, error, // <-- BURADAKİ DEĞİŞİKLİK
    config_summary, results_summary, // Özet bilgiler de hala var
  } = experiment;

  const handleCopyId = () => {
    navigator.clipboard.writeText(experiment_id);
    toast.success('Deney ID panoya kopyalandı!');
    setActionsOpen(false);
  };

  const handleToggleDetails = async () => {
    if (!isDetailsExpanded && !fetchedFullDetails) { // Detaylar açılacak ve henüz yüklenmemişse
      setDetailsLoading(true);
      try {
        const response = await fetchExperimentDetails(experiment_id);
        setFetchedFullDetails(response.data); // <-- fetchedFullDetails olarak güncellendi
      } catch (error) {
        console.error("Detaylı deney bilgisi çekilemedi:", error);
        toast.error("Detaylı deney bilgisi yüklenemedi.");
      } finally {
        setDetailsLoading(false);
      }
    }
    setIsDetailsExpanded(!isDetailsExpanded);
    setActionsOpen(false);
  };

  const isRunning = ['STARTED', 'PROGRESS'].includes(status);
  const isFinished = ['SUCCESS', 'FAILURE'].includes(status);

  const displayLoss = (results_summary?.final_loss !== null && results_summary?.final_loss !== undefined) ? results_summary.final_loss.toFixed(6) : 'N/A';
  const startTime = created_at ? new Date(created_at).toLocaleString() : 'N/A';
  const endTime = completed_at || failed_at ? new Date(completed_at || failed_at).toLocaleString() : 'N/A';

  const totalEpochs = Array.isArray(config_summary?.epochs) ? config_summary.epochs[0] : config_summary?.epochs;

  const [liveLossHistory, setLiveLossHistory] = useState([]);
  const [livePredictionData, setLivePredictionData] = useState({ x_axis: [], y_true: [], y_pred: [] });
  const [liveStatusText, setLiveStatusText] = useState('Başlatıldı');
  const [liveEpoch, setLiveEpoch] = useState(0);

  useEffect(() => {
    if (!isRunning || !task_id) {
        setLiveLossHistory([]);
        setLivePredictionData({ x_axis: [], y_true: [], y_pred: [] });
        setLiveStatusText('Başlatıldı');
        setLiveEpoch(0);
        return;
    }

    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${task_id}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.state === 'PROGRESS' && data.details) {
        setLiveStatusText(data.details.status_text);
        setLiveEpoch(data.details.epoch);

        if (data.details.loss !== undefined) {
          setLiveLossHistory(prev => {
            const newLoss = data.details.loss;
            const newEpoch = data.details.epoch;
            const updated = [...prev];
            if (newEpoch > updated.length) { 
                updated.push(newLoss);
            } else if (newEpoch - 1 >= 0 && newEpoch - 1 < updated.length) { 
                updated[newEpoch - 1] = newLoss;
            } else { 
                updated.push(newLoss);
            }
            return updated;
          });
        }

        if (data.details.validation_data && Array.isArray(data.details.validation_data.x_axis) && data.details.validation_data.x_axis.length > 0) {
          setLivePredictionData(data.details.validation_data);
        }
      } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
        setLiveStatusText(data.state === 'SUCCESS' ? 'Tamamlandı' : `Hata: ${data.result?.error?.message || data.details?.status_text}`);
        setLiveEpoch(totalEpochs); 
        // Görev bittikten sonra, UI'ın güncel Experiment objesini alması için,
        // DashboardOverview'daki polling mekanizmasına güveniyoruz.
        // Bu component'in kendi live state'ini temizlemiyoruz ki son anlık veriler kalsın.
      }
    };

    socket.onerror = (err) => {
      console.error(`WebSocket Error for task ${task_id}:`, err);
      setLiveStatusText('WebSocket Hatası!');
    };

    socket.onclose = () => {
        if (!isFinished) { 
            setLiveStatusText('Bağlantı kesildi.');
        }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Component unmounting or task finished");
      }
    };
  }, [isRunning, task_id, totalEpochs, isFinished]);

  const progressPercent = totalEpochs > 0 ? (liveEpoch / totalEpochs) * 100 : 0;

  return (
    <div className={`experiment-card card ${isSelected ? 'selected-card' : ''} ${isDetailsExpanded ? 'expanded' : ''}`}>
      {/* Kart Üst Bölümü: Checkbox, Durum, İsim, ID, Batch Adı, Aksiyonlar */}
      <div className="card-top-section">
        <div className="card-checkbox-status">
          <input type="checkbox" checked={isSelected} onChange={onSelect} title="Karşılaştırmak için seç"/>
          <span className={`status-badge status-${status?.toLowerCase() || 'unknown'}`}>{status || 'Bilinmiyor'}</span>
        </div>
        <div className="card-main-info">
            <h3 className="pipeline-name">{pipeline_name || 'N/A'}</h3>
            <span className="experiment-id">ID: {experiment_id.slice(0, 10)}...</span>
            {experiment.batch_name && <span className="batch-name">Grup: {experiment.batch_name}</span>}
        </div>
        
        {/* Aksiyon Menüsü */}
        <div className="actions-cell">
          <button className="actions-button" onClick={() => setActionsOpen(!actionsOpen)}>⋮</button>
          {actionsOpen && (
            <div className="actions-menu" onMouseLeave={() => setActionsOpen(false)}>
              <button onClick={handleToggleDetails}>
                <Icon path={ICONS.expand} /> {isDetailsExpanded ? 'Detayları Gizle' : (detailsLoading ? 'Yükleniyor...' : 'Detayları Göster')}
              </button>
              <button onClick={handleCopyId}><Icon path={ICONS.copy} /> ID'yi Kopyala</button>
            </div>
          )}
        </div>
      </div>

      {/* Ana Gövde: Özet Metrikler, İlerleme Çubuğu ve Grafikler */}
      <div className="card-body">
        <div className="card-metrics-summary">
          <p><strong>Sembol:</strong> {config_summary?.ticker || 'N/A'}</p> 
          <p><strong>Epochs:</strong> {totalEpochs || 'N/A'}</p>
          <p><strong>LR:</strong> {config_summary?.lr || 'N/A'}</p> 
          <p><strong>Final Kayıp:</strong> {displayLoss}</p>
          <p><strong>Başlangıç:</strong> {startTime}</p>
          <p><strong>Bitiş:</strong> {endTime}</p>
          {isFinished && results_summary?.r2_score !== undefined && (
            <p><strong>R² Skoru:</strong> {results_summary.r2_score.toFixed(4)}</p>
          )}
          {isFinished && results_summary?.mae !== undefined && (
            <p><strong>MAE:</strong> {results_summary.mae.toFixed(4)}</p>
          )}
        </div>

        {/* Canlı İlerleme Çubuğu (sadece çalışırken) */}
        {isRunning && (
            <div className="live-progress-bar-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <p style={{ margin: 0, color: getCssVar('--text-color-darker'), fontSize: '0.8em' }}>
                        Canlı Takip: {liveStatusText}
                    </p>
                    {totalEpochs > 0 && (
                        <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.8em' }}>
                            {liveEpoch} / {totalEpochs}
                        </span>
                    )}
                </div>
                <progress value={progressPercent} max="100"></progress>
            </div>
        )}

        {/* Grafik Bölümü (Her zaman görünür) */}
        <div className="card-charts-section">
          {/* Kayıp Grafiği */}
          <SingleExperimentChart 
            taskId={task_id} 
            mode={isRunning ? 'live' : 'report'} 
            chartType="loss" 
            reportData={isRunning ? {history: {loss: liveLossHistory}} : results} // <-- BURADAKİ DEĞİŞİKLİK
          />
          {/* Tahmin Grafiği */}
          <SingleExperimentChart 
            taskId={task_id} 
            mode={isRunning ? 'live' : 'report'} 
            chartType="prediction" 
            reportData={isRunning ? {time_index: livePredictionData.x_axis, y_true: livePredictionData.y_true, y_pred: livePredictionData.y_pred} : results} // <-- BURADAKİ DEĞİŞİKLİK
          />
        </div>
      </div>

      {/* Detaylar Bölümü (Katlanabilir) */}
      <div className="card-expanded-details">
        {detailsLoading && <p style={{textAlign: 'center'}}>Detaylar yükleniyor...</p>}
        {isDetailsExpanded && (fetchedFullDetails || (isFinished && results && config && error)) ? ( // <-- fetchedFullDetails kontrolü eklendi
            <>
                {(fetchedFullDetails?.status === 'FAILURE' || status === 'FAILURE') && (fetchedFullDetails?.error || error) && (
                    <div style={{marginBottom: '15px'}}>
                        <h4 style={{marginTop: 0, color: getCssVar('--error-color')}}>Hata Detayı</h4>
                        <pre style={{backgroundColor: getCssVar('--bg-color'), padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', fontSize: '0.8em', color: getCssVar('--error-color')}}>
                            <code>{JSON.stringify(fetchedFullDetails?.error || error, null, 2)}</code>
                        </pre>
                    </div>
                )}
                <h4 style={{marginTop: 0}}>Detaylı Konfigürasyon</h4>
                <pre style={{backgroundColor: getCssVar('--bg-color'), padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', fontSize: '0.8em'}}>
                  <code>{JSON.stringify(fetchedFullDetails?.config || config, null, 2)}</code>
                </pre>
            </>
        ) : isDetailsExpanded && isRunning && (
            <p style={{textAlign: 'center'}}>Deney devam ediyor, detaylar tamamlandığında yüklenecektir.</p>
        )}
      </div>
    </div>
  );
}

ExperimentCard.propTypes = {
  experiment: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default React.memo(ExperimentCard);