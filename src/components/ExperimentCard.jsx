import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import SingleExperimentChart from './SingleExperimentChart';
import styles from './ExperimentCard.module.css';

// --- YENİ: İkonlar burada merkezi olarak tanımlanıyor ---
const ICONS = {
    copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
    report: "M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
    chevron: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
};
const Icon = ({ path, className = '' }) => <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>;
Icon.propTypes = { path: PropTypes.string.isRequired, className: PropTypes.string };

function ExperimentCard({ experiment, isSelected, onSelect, onShowReport }) {
    const [actionsOpen, setActionsOpen] = useState(false);
    // --- YENİ: Kartın genişletilip genişletilmediğini tutan state ---
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        experiment_id, status, task_id, pipeline_name, config, results, config_summary, results_summary
    } = experiment;

    const [liveData, setLiveData] = useState({ loss: [], time_index: [], y_true: [], y_pred: [] });
    const [liveStatusText, setLiveStatusText] = useState('Başlatıldı');
    const [liveEpoch, setLiveEpoch] = useState(0);

    const isRunning = ['STARTED', 'PROGRESS'].includes(status);
    const isSuccess = status === 'SUCCESS';
    const totalEpochs = config_summary?.epochs ?? config?.training_params?.epochs ?? 0;

    useEffect(() => {
        if (!isRunning || !task_id) return;
        const socket = new WebSocket(`ws://localhost:8000/ws/task_status/${task_id}`);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.state === 'PROGRESS' && data.details) {
                setLiveStatusText(data.details.status_text || 'İşleniyor...');
                setLiveEpoch(data.details.epoch || 0);
                setLiveData(prev => ({
                    loss: [...prev.loss, data.details.loss],
                    time_index: data.details.validation_data?.x_axis || prev.time_index,
                    y_true: data.details.validation_data?.y_true || prev.y_true,
                    y_pred: data.details.validation_data?.y_pred || prev.y_pred,
                }));
            }
        };
        socket.onerror = (err) => console.error(`WebSocket Error for ${task_id}:`, err);
        return () => socket.close();
    }, [isRunning, task_id]);

    const safeToFixed = (value, digits) => (typeof value === 'number' && !isNaN(value)) ? value.toFixed(digits) : 'N/A';
    
    const renderConfigSummary = () => {
        const summaryItems = [];
        if (config_summary?.ticker) summaryItems.push({ label: 'Sembol', value: config_summary.ticker });
        else if (config_summary?.location) summaryItems.push({ label: 'Konum', value: config_summary.location });
        else summaryItems.push({ label: 'Veri', value: 'Özel' });
        
        summaryItems.push({ label: 'Epochs', value: totalEpochs || 'N/A' });
        summaryItems.push({ label: 'LR', value: safeToFixed(config_summary?.lr, 5) });
        return summaryItems;
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(experiment_id);
        toast.success('Deney ID panoya kopyalandı!');
        setActionsOpen(false);
    };

    const handleExpandToggle = (e) => {
        // Checkbox, actions butonu veya menüsü dışındaki tıklamalar için genişlet/daralt
        if (!e.target.closest(`.${styles.checkboxStatus}`) && !e.target.closest(`.${styles.actionsCell}`)) {
            setIsExpanded(!isExpanded);
        }
    };

    // --- DEĞİŞİKLİK: Class'lar artık state'e göre dinamik olarak atanıyor ---
    const cardClasses = `${styles.card} ${isSelected ? styles.selectedCard : ''} ${isExpanded ? styles.expandedCard : ''}`;
  
    return (
        <div className={cardClasses}>
            {/* Tıklanabilir başlık alanı */}
            <div className={styles.header} onClick={handleExpandToggle}>
                <div className={styles.checkboxStatus}>
                    <input type="checkbox" checked={isSelected} onChange={onSelect} title="Karşılaştırmak için seç" onClick={e => e.stopPropagation()} />
                    <span className={`status-badge status-${status?.toLowerCase() || 'unknown'}`}>{status || 'Bilinmiyor'}</span>
                </div>
                <div className={styles.mainInfo}>
                    <h3 className={styles.pipelineName}>{pipeline_name || 'N/A'}</h3>
                    <span className={styles.experimentId}>ID: {experiment_id}</span>
                    {experiment.batch_name && <span className={styles.batchName}>Grup: {experiment.batch_name}</span>}
                </div>
                 <div className={styles.summaryContainer}>
                    {renderConfigSummary().map(item => (
                        <div key={item.label}><strong>{item.label}:</strong> <span>{item.value}</span></div>
                    ))}
                </div>
                <div className={styles.actionsCell}>
                    <button className={styles.actionsButton} onClick={(e) => { e.stopPropagation(); setActionsOpen(prev => !prev); }}>⋮</button>
                    {actionsOpen && (
                        <div className="actions-menu" onMouseLeave={() => setActionsOpen(false)}>
                            <button onClick={handleCopyId}><Icon path={ICONS.copy} /> ID'yi Kopyala</button>
                            {isSuccess && <button onClick={() => { onShowReport(experiment_id); setActionsOpen(false); }}><Icon path={ICONS.report} /> Raporu Görüntüle</button>}
                        </div>
                    )}
                    {/* --- YENİ: Genişletme ikonu --- */}
                    <Icon path={ICONS.chevron} className={styles.expandIcon} />
                </div>
            </div>

            {/* --- YENİ: Canlı ilerleme çubuğu ayrı bir bölümde --- */}
            {isRunning && (
                <div className={styles.liveProgressBarSection}>
                    <div className={styles.progressHeader}>
                        <span className={styles.statusText}>{liveStatusText}</span>
                        {totalEpochs > 0 && (<span className={styles.epochCounter}>{liveEpoch} / {totalEpochs}</span>)}
                    </div>
                    <progress value={totalEpochs > 0 ? (liveEpoch / totalEpochs) * 100 : 0} max="100"></progress>
                </div>
            )}

            {/* --- YENİ: Genişletilebilir içerik alanı --- */}
            <div className={styles.collapsibleContent}>
                <div className={styles.chartsSection}>
                    <SingleExperimentChart chartType="loss" data={isRunning ? liveData : results} isLive={isRunning} enableZoom={!isRunning} />
                    <SingleExperimentChart chartType="prediction" data={isRunning ? liveData : results} isLive={isRunning} enableZoom={!isRunning} />
                </div>
                {/* İleride buraya daha fazla detay eklenebilir */}
            </div>
        </div>
    );
}

ExperimentCard.propTypes = {
    experiment: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onShowReport: PropTypes.func.isRequired,
};

export default React.memo(ExperimentCard);