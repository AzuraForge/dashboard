// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentsList.jsx (Prop Tabanlı) ==========
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

function ExperimentsList({ experiments }) { // Sadece experiments prop'unu alıyoruz
  if (!experiments || experiments.length === 0) return <p className="feedback info">Henüz gösterilecek bir deney bulunamadı.</p>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Deney ID</th>
            <th>Durum</th>
            <th>Pipeline</th>
            <th>Sembol</th>
            <th>Kayıp</th>
            <th>Bitiş Tarihi</th> {/* Yeni sütun */}
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.id}>
              <td className="exp-id clickable-cell">
                <Link to={`/experiments/${exp.id}`}>
                  {exp.id}
                </Link>
              </td>
              <td><span className={`status-badge status-${exp.status?.toLowerCase() || 'unknown'}`}>{exp.status || 'Bilinmiyor'}</span></td>
              <td>{exp.config?.pipeline_name || exp.pipeline_name || 'N/A'}</td>
              <td>{exp.config?.data_sourcing?.ticker || exp.ticker || 'N/A'}</td>
              <td>{exp.final_loss !== undefined && exp.final_loss !== null ? exp.final_loss.toFixed(6) : 'N/A'}</td>
              <td>{exp.completed_at ? new Date(exp.completed_at).toLocaleString() : 'N/A'}</td> {/* Tarih formatlama */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Prop tiplerini belirleyelim
ExperimentsList.propTypes = {
  experiments: PropTypes.array.isRequired,
};

export default ExperimentsList;