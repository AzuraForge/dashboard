// dashboard/src/components/ExperimentCard.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import SingleExperimentChart from './SingleExperimentChart';
import styles from './ExperimentCard.module.css';

const Icon = ({ path }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d={path} /></svg>;
Icon.propTypes = { path: PropTypes.string.isRequired };
const ICONS = {
    copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
    report: "M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
};

function ExperimentCard({ experiment, isSelected, onSelect, onShowReport }) { // onShowReport prop'u eklendi
    // ... (state ve useEffect hook'ları aynı kalıyor) ...
    const [actionsOpen, setActionsOpen] = useState(false);
    const {
        experiment_id, status, task_id, pipeline_name, created_at, completed_at, failed_at,
        config, results, config_summary, results_summary,
    } = experiment;

    const [liveData, setLiveData] = useState({ loss: [], time_index: [], y_true: [], y_pred: [] });
    const [liveStatusText, setLiveStatusText] = useState('Başlatıldı');
    const [liveEpoch, setLiveEpoch] = useState(0);

    const isRunning = ['STARTED', 'PROGRESS'].includes(status);
    const isSuccess = status === 'SUCCESS';
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
                    const newLiveData = { ...prev };
                    if (data.details.loss !== undefined) { newLiveData.loss = [...prev.loss, data.details.loss]; }
                    if (data.details.validation_data) {
                        newLiveData.time_index = data.details.validation_data.x_axis || [];
                        newLiveData.y_true = data.details.validation_data.y_true || [];
                        newLiveData.y_pred = data.details.validation_data.y_pred || [];
                    }
                    return newLiveData;
                });
            }
        };
        socket.onerror = (err) => console.error(`WebSocket Error for ${task_id}:`, err);
        return () => socket.close();
    }, [isRunning, task_id]);

    const safeToFixed = (value, digits) => (typeof value === 'number' && !isNaN(value)) ? value.toFixed(digits) : 'N/A';
    const lossChartData = isRunning ? { loss: liveData.loss } : { loss: results?.history?.loss };
    const predictionChartData = isRunning ? liveData : results;
    
    const handleCopyId = () => {
        navigator.clipboard.writeText(experiment_id);
        toast.success('Deney ID panoya kopyalandı!');
        setActionsOpen(false);
    };

    const cardClasses = `${styles.card} ${isSelected ? styles.selectedCard : ''}`;
  
    return (
        <div className={cardClasses}>
            <div className={styles.topSection}>
                <div className={styles.checkboxStatus}>
                    <input type="checkbox" checked={isSelected} onChange={onSelect} title="Karşılaştırmak için seç"/>
                    <span className={`status-badge status-${status?.toLowerCase() || 'unknown'}`}>{status || 'Bilinmiyor'}</span>
                </div>
                <div className={styles.mainInfo}>
                    <h3 className={styles.pipelineName}>{pipeline_name || 'N/A'}</h3>
                    <span className={styles.experimentId}>ID: {experiment_id.slice(0, 10)}...</span>
                    {experiment.batch_name && <span className={styles.batchName}>Grup: {experiment.batch_name}</span>}
                </div>
                <div className="actions-cell">
                    <button className="actions-button" onClick={() => setActionsOpen(!actionsOpen)}>⋮</button>
                    {actionsOpen && (
                        <div className="actions-menu" onMouseLeave={() => setActionsOpen(false)}>
                            <button onClick={handleCopyId}><Icon path={ICONS.copy} /> ID'yi Kopyala</button>
                            {/* Rapor Görüntüle Butonu */}
                            {isSuccess && <button onClick={() => { onShowReport(experiment_id); setActionsOpen(false); }}><Icon path={ICONS.report} /> Raporu Görüntüle</button>}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.metricsSummary}>
                    <p><strong>Sembol/Konum:</strong> <span>{config_summary?.ticker || `${config?.data_sourcing?.latitude || 'N/A'}, ${config?.data_sourcing?.longitude || 'N/A'}`}</span></p>
                    <p><strong>Epochs:</strong> <span>{totalEpochs || 'N/A'}</span></p>
                    <p><strong>LR:</strong> <span>{safeToFixed(config_summary?.lr ?? config?.training_params?.lr, 4)}</span></p>
                    <p><strong>Final Kayıp:</strong> <span>{safeToFixed(results_summary?.final_loss, 6)}</span></p>
                    <p><strong>R² Skoru:</strong> <span>{safeToFixed(results_summary?.r2_score, 4)}</span></p>
                    <p><strong>MAE:</strong> <span>{safeToFixed(results_summary?.mae, 4)}</span></p>
                </div>

                <div className={styles.chartsSection}>
                    <SingleExperimentChart chartType="loss" data={lossChartData} isLive={isRunning} enableZoom={!isRunning} />
                    <SingleExperimentChart chartType="prediction" data={predictionChartData} isLive={isRunning} enableZoom={!isRunning} />
                </div>
                
                {isRunning && (
                    <div className={styles.liveProgressBarSection}>
                        <div className={styles.progressHeader}>
                            <span className={styles.statusText}>{liveStatusText}</span>
                            {totalEpochs > 0 && (<span className={styles.epochCounter}>{liveEpoch} / {totalEpochs}</span>)}
                        </div>
                        <progress value={totalEpochs > 0 ? (liveEpoch / totalEpochs) * 100 : 0} max="100"></progress>
                    </div>
                )}
            </div>
        </div>
    );
}

ExperimentCard.propTypes = {
    experiment: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onShowReport: PropTypes.func.isRequired, // Yeni prop
};

export default React.memo(ExperimentCard);