// dashboard/src/components/ExperimentCard.jsx

import React, { useState, useEffect, useRef } from 'react'; 
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import SingleExperimentChart from './SingleExperimentChart'; 
import { getCssVar } from '../utils/cssUtils'; 
import { fetchExperimentDetails } from '../services/api'; // Yeni import

const Icon = ({ path, className }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d={path} /></svg>;
Icon.propTypes = { path: PropTypes.string.isRequired, className: PropTypes.string };

const ICONS = {
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2-2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  expand: "M19 19H5V5h14v14zm0-16H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" 
};

function ExperimentCard({ experiment, isSelected, onSelect }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // Detayların katlanabilir durumu
  // KRİTİK DÜZELTME: Tam detaylar için yeni state'ler ekliyoruz.
  const [fullDetails, setFullDetails] = useState(null); 
  const [detailsLoading, setDetailsLoading] = useState(false);

  const { 
    experiment_id, status, task_id, pipeline_name,
    created_at, completed_at, failed_at,
    config_summary, results_summary, 
  } = experiment;

  const handleCopyId = () => {
    navigator.clipboard.writeText(experiment_id);
    toast.success('Deney ID panoya kopyalandı!');
    setActionsOpen(false);
  };

  const handleToggleDetails = async () => {
    if (!isDetailsExpanded && !fullDetails) { // Detaylar açılacak ve henüz yüklenmemişse
      setDetailsLoading(true);
      try {
        const response = await fetchExperimentDetails(experiment_id);
        setFullDetails(response.data);
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

  const finalLoss = results_summary?.final_loss;
  const displayLoss = (finalLoss !== null && finalLoss !== undefined) ? finalLoss.toFixed(6) : 'N/A';
  const startTime = created_at ? new Date(created_at).toLocaleString() : 'N/A';
  const endTime = completed_at || failed_at ? new Date(completed_at || failed_at).toLocaleString() : 'N/A';

  // config_summary'den epochs'u al, eğer liste ise ilk elemanı al (API'ye tekli gönderdiğimiz için)
  const totalEpochs = Array.isArray(config_summary?.epochs) ? config_summary.epochs[0] : config_summary?.epochs;

  // Canlı takip için ilerleme yüzdesi ve metin
  const [liveProgress, setLiveProgress] = useState({ epoch: 0, totalEpochs: totalEpochs, text: 'Başlatıldı' });

  // WebSocket'ten gelen canlı veriyi yakalamak için useEffect
  useEffect(() => {
    // Sadece çalışır durumdaki görevler için WebSocket başlat
    if (!isRunning || !task_id) {
        setLiveProgress({ epoch: 0, totalEpochs: totalEpochs, text: 'Başlatıldı' });
        return;
    }

    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${task_id}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.state === 'PROGRESS' && data.details) {
        setLiveProgress({
          epoch: data.details.epoch,
          totalEpochs: data.details.total_epochs,
          text: data.details.status_text,
        });
        // KRİTİK DÜZELTME: LivePredictionCallback'ten gelen güncel tahmin verisi için
        // fullDetails'i de güncellememiz gerekiyor, aksi takdirde rapor modunda güncel görünmez.
        // Ancak bu, fullDetails'ı her epoch'ta güncellemek anlamına gelir ki bu verimsiz olabilir.
        // Daha iyi bir yaklaşım: LivePredictionCallback sadece canlı veriyi yayınlasın,
        // sonuçlandığında tam datayı API'ye göndersin, Frontend API'den çeksin.
        // Şu anki mimaride, liveData state'i zaten grafikleri güncelliyor, fullDetails sadece statik rapor için.
      } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
        setLiveProgress(prev => ({
          ...prev,
          epoch: prev.totalEpochs, 
          text: data.state === 'SUCCESS' ? 'Tamamlandı' : `Hata: ${data.result?.error?.message || data.details?.status_text}`,
        }));
        // Görev bittiğinde fullDetails'ı yeniden yüklemek iyi bir fikir olabilir,
        // ancak DashboardOverview API'yi zaten 20 saniyede bir poll ediyor.
      }
    };

    socket.onerror = (err) => {
      console.error(`WebSocket Error for task ${task_id}:`, err);
      setLiveProgress(prev => ({ ...prev, text: 'WebSocket Hatası!' }));
    };

    socket.onclose = () => {
        if (!isFinished) { 
            setLiveProgress(prev => ({ ...prev, text: 'Bağlantı kesildi.' }));
        }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Component unmounting or task finished");
      }
    };
  }, [isRunning, task_id, totalEpochs, isFinished]);

  const progressPercent = liveProgress.totalEpochs > 0 ? (liveProgress.epoch / liveProgress.totalEpochs) * 100 : 0;

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
              <button onClick={handleToggleDetails}> {/* handleToggleDetails kullan */}
                <Icon path={ICONS.expand} /> {isDetailsExpanded ? 'Detayları Gizle' : 'Detayları Göster'}
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
                        Canlı Takip: {liveProgress.text}
                    </p>
                    {liveProgress.totalEpochs > 0 && (
                        <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.8em' }}>
                            {liveProgress.epoch} / {liveProgress.totalEpochs}
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
            reportData={fullDetails?.results || experiment.results} // fullDetails varsa onu kullan
          />
          {/* Tahmin Grafiği */}
          <SingleExperimentChart 
            taskId={task_id} 
            mode={isRunning ? 'live' : 'report'} 
            chartType="prediction" 
            reportData={fullDetails?.results || experiment.results} // fullDetails varsa onu kullan
          />
        </div>
      </div>

      {/* Detaylar Bölümü (Katlanabilir) */}
      <div className="card-expanded-details">
        {detailsLoading && <p style={{textAlign: 'center'}}>Detaylar yükleniyor...</p>}
        {fullDetails && (
            <>
                {fullDetails.status === 'FAILURE' && fullDetails.error && (
                    <div style={{marginBottom: '15px'}}>
                        <h4 style={{marginTop: 0, color: getCssVar('--error-color')}}>Hata Detayı</h4>
                        <pre style={{backgroundColor: getCssVar('--bg-color'), padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', fontSize: '0.8em', color: getCssVar('--error-color')}}>
                            <code>{JSON.stringify(fullDetails.error, null, 2)}</code>
                        </pre>
                    </div>
                )}
                <h4 style={{marginTop: 0}}>Detaylı Konfigürasyon</h4>
                <pre style={{backgroundColor: getCssVar('--bg-color'), padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', fontSize: '0.8em'}}>
                  <code>{JSON.stringify(fullDetails.config, null, 2)}</code>
                </pre>
            </>
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