import PropTypes from 'prop-types';
import ExperimentRow from './ExperimentRow';

// GÜNCELLEME: Yeni propları alacak şekilde düzenlendi
function ExperimentsList({ experiments, selectedIds, onSelect, onReRun, setTrackingTaskId }) {
  if (!experiments || experiments.length === 0) {
    return <p className="feedback info">Henüz gösterilecek bir deney bulunamadı.</p>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{width: '40px'}}></th> {/* Checkbox için boş başlık */}
            <th>Durum</th>
            <th>Deney Detayları</th>
            <th>Parametreler</th>
            <th>Sonuçlar</th>
            <th>Zamanlama</th>
            <th style={{width: '50px'}}>Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <ExperimentRow 
              key={exp.experiment_id} 
              experiment={exp} 
              isSelected={selectedIds.has(exp.experiment_id)}
              onSelect={() => onSelect(exp.experiment_id)}
              onReRun={() => onReRun(exp.config)}
              setTrackingTaskId={setTrackingTaskId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

ExperimentsList.propTypes = {
  experiments: PropTypes.array.isRequired,
  selectedIds: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onReRun: PropTypes.func.isRequired,
  setTrackingTaskId: PropTypes.func.isRequired,
};

export default ExperimentsList;