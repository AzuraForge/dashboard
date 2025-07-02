// dashboard/src/components/ExperimentCard.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import SingleExperimentChart from './SingleExperimentChart';
import { getCssVar } from '../utils/cssUtils';

const Icon = ({ path }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d={path} /></svg>;
Icon.propTypes = { path: PropTypes.string.isRequired };

const ICONS = {
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  expand: "M19 19H5V5h14v14zm0-16H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
};

function ExperimentCard({ experiment, isSelected, onSelect }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const {
    experiment_id, status, task_id, pipeline_name, created_at, completed_at, failed_at,
    config, results, config_summary, results_summary,
  } = experiment;

  const [liveData, setLiveData] = useState({ loss: [], time_index: [], y_true: [], y_pred: [] });
  const [liveStatusText, setLiveStatusText] = useState('Başlatıldı');
  const [liveEpoch, setLiveEpoch] = useState(0);

  const isRunning = ['STARTED', 'PROGRESS'].includes(status);
  const totalEpochs = config_summary?.epochs ?? config?.training_params?.epochs ?? 0;

  useEffect(() => {
    if (!isRunning || !task_id) {
      setLiveData({ loss: [], time_index: [], y_true: [], y_pred: [] });
      setLiveEpoch(0);
      setLiveStatusText('Bekleniyor');
      return;
    }

    const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${task_id}`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.state === 'PROGRESS' && data.details) {
        setLiveStatusText(data.details.status_text || 'İşleniyor...');
        setLiveEpoch(data.details.epoch || 0);

        setLiveData(prev => {
          // Önceki state'in bir kopyasını al
          const newLiveData = { ...prev };
          
          // Kayıp verisini güncelle
          if (data.details.loss !== undefined) {
            newLiveData.loss = [...prev.loss, data.details.loss];
          }
          
          // Tahmin verisini güncelle (eğer geldiyse)
          if (data.details.validation_data) {
            newLiveData.time_index = data.details.validation_data.x_axis || [];
            newLiveData.y_true = data.details.validation_data.y_true || [];
            newLiveData.y_pred = data.details.validation_data.y_pred || [];
          }

          return newLiveData;
        });
      }
    };
    socket.onerror = (err) => { console.error(`WebSocket Error for ${task_id}:`, err); };
    return () => { socket.close(); };
  }, [isRunning, task_id]);

  const safeToFixed = (value, digits) => (typeof value === 'number' && !isNaN(value)) ? value.toFixed(digits) : 'N/A';

  const lossChartData = isRunning ? { loss: liveData.loss } : { loss: results?.history?.loss };
  const predictionChartData = isRunning ? liveData : results;

  const handleCopyId = () => {
    navigator.clipboard.writeText(experiment_id);
    toast.success('Deney ID panoya kopyalandı!');
    setActionsOpen(false);
  };
  
  return (
    <div className={`experiment-card card ${isSelected ? 'selected-card' : ''}`}>
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
              <button onClick={handleCopyId}><Icon path={ICONS.copy} /> ID'yi Kopyala</button>
            </div>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="card-metrics-summary">
          <p><strong>Sembol/Konum:</strong> {config_summary?.ticker || `${config?.data_sourcing?.latitude || 'N/A'}, ${config?.data_sourcing?.longitude || 'N/A'}`}</p>
          <p><strong>Epochs:</strong> {totalEpochs || 'N/A'}</p>
          <p><strong>LR:</strong> {safeToFixed(config_summary?.lr ?? config?.training_params?.lr, 4)}</p>
          <p><strong>Final Kayıp:</strong> {safeToFixed(results_summary?.final_loss, 6)}</p>
          <p><strong>Başlangıç:</strong> {created_at ? new Date(created_at).toLocaleString() : 'N/A'}</p>
          <p><strong>Bitiş:</strong> {completed_at || failed_at ? new Date(completed_at || failed_at).toLocaleString() : 'N/A'}</p>
          <p><strong>R² Skoru:</strong> {safeToFixed(results_summary?.r2_score, 4)}</p>
          <p><strong>MAE:</strong> {safeToFixed(results_summary?.mae, 4)}</p>
        </div>

        {isRunning && (
            <div className="live-progress-bar-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <p style={{ margin: 0, color: getCssVar('--text-color-darker'), fontSize: '0.8em' }}>{liveStatusText}</p>
                    {totalEpochs > 0 && (<span style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.8em' }}>{liveEpoch} / {totalEpochs}</span>)}
                </div>
                <progress value={totalEpochs > 0 ? (liveEpoch / totalEpochs) * 100 : 0} max="100"></progress>
            </div>
        )}

        <div className="card-charts-section">
          <SingleExperimentChart chartType="loss" data={lossChartData} isLive={isRunning} enableZoom={!isRunning} />
          <SingleExperimentChart chartType="prediction" data={predictionChartData} isLive={isRunning} enableZoom={!isRunning} />
        </div>
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