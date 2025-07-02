// dashboard/src/components/ExperimentCard.jsx

import React, { useState, useEffect } from 'react';
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
  const [fetchedFullDetails, setFetchedFullDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const {
    experiment_id, status, task_id, pipeline_name,
    created_at, completed_at, failed_at,
    config, results, error,
    config_summary, results_summary,
  } = experiment;

  const handleCopyId = () => {
    navigator.clipboard.writeText(experiment_id);
    toast.success('Deney ID panoya kopyalandı!');
    setActionsOpen(false);
  };

  const handleToggleDetails = async () => {
    if (!isDetailsExpanded && !fetchedFullDetails) {
      setDetailsLoading(true);
      try {
        const response = await fetchExperimentDetails(experiment_id);
        setFetchedFullDetails(response.data);
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
  
  // =========================================================================
  // DÜZELTME BURADA: Daha güvenli veri erişimi
  // =========================================================================
  const safeToFixed = (value, digits) => {
    // Sadece değer bir sayı ise toFixed uygula, değilse 'N/A' döndür.
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(digits);
    }
    return 'N/A';
  };

  // Güvenli fonksiyonu kullanarak değerleri formatla
  const displayLoss = safeToFixed(results_summary?.final_loss, 6);
  const displayR2 = safeToFixed(results_summary?.r2_score, 4);
  const displayMae = safeToFixed(results_summary?.mae, 4);
  // =========================================================================

  const startTime = created_at ? new Date(created_at).toLocaleString() : 'N/A';
  const endTime = completed_at || failed_at ? new Date(completed_at || failed_at).toLocaleString() : 'N/A';

  const totalEpochs = config_summary?.epochs ?? 0;

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
          setLiveLossHistory(prev => [...prev, data.details.loss]);
        }
        if (data.details.validation_data && Array.isArray(data.details.validation_data.x_axis) && data.details.validation_data.x_axis.length > 0) {
          setLivePredictionData(data.details.validation_data);
        }
      } else if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
        setLiveStatusText(data.state === 'SUCCESS' ? 'Tamamlandı' : `Hata: ${data.result?.error?.message || data.details?.status_text}`);
        setLiveEpoch(totalEpochs);
      }
    };
    socket.onerror = (err) => { console.error(`WebSocket Error for task ${task_id}:`, err); setLiveStatusText('WebSocket Hatası!'); };
    socket.onclose = () => { if (!isFinished) { setLiveStatusText('Bağlantı kesildi.'); } };
    return () => { if (socket.readyState === WebSocket.OPEN) { socket.close(1000, "Component unmounting"); } };
  }, [isRunning, task_id, totalEpochs, isFinished]);

  const progressPercent = totalEpochs > 0 ? (liveEpoch / totalEpochs) * 100 : 0;

  return (
    <div className={`experiment-card card ${isSelected ? 'selected-card' : ''} ${isDetailsExpanded ? 'expanded' : ''}`}>
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
        <div className="actions-cell">
          <button className="actions-button" onClick={() => setActionsOpen(!actionsOpen)}>⋮</button>
          {actionsOpen && (
            <div className="actions-menu" onMouseLeave={() => setActionsOpen(false)}>
              <button onClick={handleToggleDetails}><Icon path={ICONS.expand} /> {isDetailsExpanded ? 'Detayları Gizle' : (detailsLoading ? 'Yükleniyor...' : 'Detayları Göster')}</button>
              <button onClick={handleCopyId}><Icon path={ICONS.copy} /> ID'yi Kopyala</button>
            </div>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="card-metrics-summary">
          <p><strong>Sembol/Konum:</strong> {config_summary?.ticker || `${config?.data_sourcing?.latitude}, ${config?.data_sourcing?.longitude}` || 'N/A'}</p> 
          <p><strong>Epochs:</strong> {totalEpochs || 'N/A'}</p>
          <p><strong>LR:</strong> {config_summary?.lr || config?.training_params?.lr || 'N/A'}</p> 
          <p><strong>Final Kayıp:</strong> {displayLoss}</p>
          <p><strong>Başlangıç:</strong> {startTime}</p>
          <p><strong>Bitiş:</strong> {endTime}</p>
          {isFinished && <p><strong>R² Skoru:</strong> {displayR2}</p>}
          {isFinished && <p><strong>MAE:</strong> {displayMae}</p>}
        </div>
        {isRunning && (
            <div className="live-progress-bar-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <p style={{ margin: 0, color: getCssVar('--text-color-darker'), fontSize: '0.8em' }}>Canlı Takip: {liveStatusText}</p>
                    {totalEpochs > 0 && (<span style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.8em' }}>{liveEpoch} / {totalEpochs}</span>)}
                </div>
                <progress value={progressPercent} max="100"></progress>
            </div>
        )}
        <div className="card-charts-section">
          <SingleExperimentChart taskId={task_id} mode={isRunning ? 'live' : 'report'} chartType="loss" reportData={results} />
          <SingleExperimentChart taskId={task_id} mode={isRunning ? 'live' : 'report'} chartType="prediction" reportData={results} />
        </div>
      </div>
      <div className="card-expanded-details">
        {detailsLoading && <p style={{textAlign: 'center'}}>Detaylar yükleniyor...</p>}
        {isDetailsExpanded && (fetchedFullDetails || (isFinished && results && config && error)) ? (
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