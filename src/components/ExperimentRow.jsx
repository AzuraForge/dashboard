// Bu dosyanın içeriği de önceki cevaptaki ile aynı, tam halini tekrar veriyorum
import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

const Icon = ({ path }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d={path} /></svg>;
Icon.propTypes = { path: PropTypes.string.isRequired };

const ICONS = {
  rerun: "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  satellite: "M6.34 5.34L4.93 3.93l-1.41 1.41 1.41 1.41C3.89 7.79 3.5 9.05 3.5 10.41c0 .46.06.91.16 1.34l-2.48 1.43c-.22.13-.34.38-.34.65v1.14c0 .27.11.52.34.65l2.48 1.43c-.1.43-.16.88-.16 1.34 0 2.21 1.79 4 4 4s4-1.79 4-4c0-1.37-.69-2.63-1.76-3.34l1.41-1.41-1.41-1.41-1.41 1.41C9.11 6.1 9.5 4.95 9.5 3.59c0-.46-.06-.91-.16-1.34l2.48-1.43c.22-.13.34-.38.34-.65V-.98c0-.27-.11-.52-.34-.65L9.34.8c.1-.43.16-.88.16-1.34 0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.37.69 2.63 1.76 3.34zm.24 9.35l-1.24-.71c.12-.52.19-1.06.19-1.61s-.07-1.09-.19-1.61l1.24-.71C7.58 10.9 8.5 12.05 8.5 13.41s-.92 2.51-1.92 3.28zM12 17.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z",
};

function ExperimentRow({ experiment, isSelected, onSelect, onReRun, setTrackingTaskId }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const { experiment_id, status, config, results, completed_at, failed_at, task_id } = experiment;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success('Konfigürasyon panoya kopyalandı!');
    setActionsOpen(false);
  };
  const isRunning = ['STARTED', 'PROGRESS', 'PENDING'].includes(status);
  return (
    <tr className={isSelected ? 'selected-row' : ''}>
      <td><input type="checkbox" checked={isSelected} onChange={onSelect} title="Karşılaştırmak için seç"/></td>
      <td><span className={`status-badge status-${status?.toLowerCase() || 'unknown'}`}>{status || 'Bilinmiyor'}</span></td>
      <td><div className="detail-cell"><strong>{config?.pipeline_name || 'N/A'}</strong><span className="exp-id">{experiment_id}</span></div></td>
      <td><div className="detail-cell"><span>Ticker: <strong>{config?.data_sourcing?.ticker || 'N/A'}</strong></span><span>Epochs: <strong>{config?.training_params?.epochs || 'N/A'}</strong>, LR: <strong>{config?.training_params?.lr || 'N/A'}</strong></span></div></td>
      <td><div className="detail-cell"><span>Final Kayıp: <strong>{results?.final_loss !== undefined ? results.final_loss.toFixed(6) : 'N/A'}</strong></span></div></td>
      <td><div className="detail-cell"><span>Başlangıç: {new Date(config.start_time).toLocaleString()}</span><span>Bitiş: {completed_at || failed_at ? new Date(completed_at || failed_at).toLocaleString() : 'N/A'}</span></div></td>
      <td className="actions-cell">
        <button className="actions-button" onClick={() => setActionsOpen(!actionsOpen)}>⋮</button>
        {actionsOpen && (
          <div className="actions-menu" onMouseLeave={() => setActionsOpen(false)}>
            {isRunning && <button onClick={() => { setTrackingTaskId(task_id); setActionsOpen(false); }}><Icon path={ICONS.satellite} /> Canlı İzle</button>}
            <button onClick={() => { onReRun(); setActionsOpen(false); }}><Icon path={ICONS.rerun} /> Yeniden Çalıştır</button>
            <button onClick={handleCopyConfig}><Icon path={ICONS.copy} /> Config'i Kopyala</button>
          </div>
        )}
      </td>
    </tr>
  );
}
ExperimentRow.propTypes = { experiment: PropTypes.object.isRequired, isSelected: PropTypes.bool.isRequired, onSelect: PropTypes.func.isRequired, onReRun: PropTypes.func.isRequired, setTrackingTaskId: PropTypes.func.isRequired, };
export default ExperimentRow;